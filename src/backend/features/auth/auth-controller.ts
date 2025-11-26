import { injectable, inject } from 'inversify';
import { AuthService } from './auth-service';
import { UserDAO } from "../../../dao/user-dao";

@injectable()
export class AuthController {
  constructor(
    @inject(AuthService) private authService: AuthService,
    @inject(UserDAO) private userDAO: UserDAO
  ) {}

  async authenticateWithGoogle(accessToken: string) {
    try {
      // Fetch user info from Google
      const googleUser = await this.authService.fetchGoogleUserInfo(accessToken);

      // Proper auth algorithm:
      // 1. Google ID is the primary identifier (stable across email changes)
      // 2. Email conflicts are handled gracefully
      // 3. Only update name (emails stay as originally registered)

      let user = await this.userDAO.findByGoogleId(googleUser.id);

      if (!user) {
        // No user with this Google ID exists
        // Check if email is already taken by another user
        const existingUserWithEmail = await this.userDAO.findByEmail(googleUser.email);

        if (existingUserWithEmail) {
          // Email is already taken by another account
          // This could happen if:
          // 1. User previously signed up without Google OAuth
          // 2. Another user is using this email
          return {
            success: false,
            error: "An account with this email already exists. Please sign in with the original method used for this email."
          };
        }

        // Create new user
        const userId = await this.userDAO.create({
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
        });

        user = await this.userDAO.findById(userId);
      } else {
        // User exists with this Google ID
        // Only update name (not email - to avoid conflicts)
        // If user changed email in Google, they keep using our system with their original email
        if (user.name !== googleUser.name) {
          await this.userDAO.update(user.id, {
            name: googleUser.name,
            // Note: We DON'T update email even if it changed in Google
            // This prevents email conflicts and maintains data integrity
          });
          user = await this.userDAO.findById(user.id);
        }
      }

      if (!user) {
        return { success: false, error: "Failed to create or retrieve user" };
      }

      // Create JWT token
      const token = await this.authService.createJWT(user.id);

      return { success: true, user, token };
    } catch (error) {
      console.error("Auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    // Logout is handled by clearing the cookie in the handler
    return { success: true };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userDAO.findById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    // Return user without sensitive fields
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    };
  }

  async getOrCreateUser(googleId: string, email: string, name?: string): Promise<number> {
    // Check if user exists by email
    const user = await this.userDAO.findByEmail(email);

    if (!user) {
      // Create new user with Google ID
      const userId = await this.userDAO.create({
        email,
        name: name || '',
        google_id: googleId,
      });

      return userId;
    } else if (!user.google_id) {
      // Update existing user with Google ID if not set
      await this.userDAO.update(user.id, {
        google_id: googleId,
      });
    }

    return user.id;
  }
}