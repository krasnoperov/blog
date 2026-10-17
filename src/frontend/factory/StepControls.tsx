interface StepControlsProps {
  step: number;
  count: number;
  playing: boolean;
  onPlay: (playing: boolean) => void;
  onGo: (step: number) => void;
}

export function StepControls({ step, count, playing, onPlay, onGo }: StepControlsProps) {
  return (
    <div className="fx-controls">
      <button type="button" className="fx-button" onClick={() => onGo(step - 1)} aria-label="Previous step">←</button>
      <button type="button" className="fx-button" onClick={() => onPlay(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? 'pause' : 'play'}
      </button>
      <button type="button" className="fx-button" onClick={() => onGo(step + 1)} aria-label="Next step">→</button>
      <span className="fx-count">{String(step + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
    </div>
  );
}
