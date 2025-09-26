export class TimingTracker {
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  end(): void {
    this.endTime = Date.now();
  }

  getDuration(): number {
    const end = this.endTime ?? Date.now();
    return end - this.startTime;
  }

  getTimings(): {
    start: string;
    end: string;
    duration_ms: number;
  } {
    const end = this.endTime ?? Date.now();
    return {
      start: new Date(this.startTime).toISOString(),
      end: new Date(end).toISOString(),
      duration_ms: end - this.startTime,
    };
  }
}
