import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { localeFromHeader, localeStorage, type AppLocale } from './locale-context';

@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const raw = req.headers?.['accept-language'];
    const header = Array.isArray(raw) ? raw[0] : raw;
    const locale = localeFromHeader(header) as AppLocale;
    return localeStorage.run(locale, () => next.handle());
  }
}
