# Workflows

This directory contains Cloudflare Workflows for async processing.

## Creating a New Workflow

1. Create a file: `MyWorkflow.ts`
2. Extend `WorkflowEntrypoint`
3. Define input type
4. Implement `run()` method with steps
5. Export workflow in `src/worker/unified.ts` and `src/worker/processing.ts`
6. Add binding in wrangler configs
7. Update `Bindings` type in `src/core/types.ts`

## Example Template

```typescript
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import type { Bindings } from '../../core/types';

export type MyWorkflowInput = {
  jobId: string;
  data: Record<string, unknown>;
};

export class MyWorkflow extends WorkflowEntrypoint<Bindings, MyWorkflowInput> {
  async run(event: WorkflowEvent<MyWorkflowInput>, step: WorkflowStep) {
    const { jobId, data } = event.payload;

    // Step 1: Initialize
    await step.do('init', async () => {
      console.log('Starting job', jobId);
    });

    // Step 2: Process with retries
    const result = await step.do('process', {
      retries: { limit: 3, delay: '30 seconds', backoff: 'exponential' },
      timeout: '5 minutes',
    }, async () => {
      // Your processing logic here
      return { status: 'completed' };
    });

    // Step 3: Finalize
    await step.do('finalize', async () => {
      console.log('Job completed', jobId, result);
    });

    return result;
  }
}
```

## Key Concepts

- **Idempotency**: Each step caches results, safe to restart
- **Retries**: Configure per-step retry logic
- **Timeout**: Set timeouts to prevent hanging
- **Backoff**: Use exponential backoff for external API calls
