import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { finalize, type Observable } from 'rxjs';

@Injectable()
export class MetricsService {
  private requests = 0;
  private errors = 0;
  private durationMs = 0;
  observe(status: number, durationMs: number) {
    this.requests += 1;
    this.durationMs += durationMs;
    if (status >= 500) this.errors += 1;
  }
  snapshot() {
    return { requests: this.requests, errors: this.errors, durationMs: this.durationMs };
  }
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = performance.now();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    return next
      .handle()
      .pipe(finalize(() => this.metrics.observe(response.statusCode, performance.now() - started)));
  }
}
