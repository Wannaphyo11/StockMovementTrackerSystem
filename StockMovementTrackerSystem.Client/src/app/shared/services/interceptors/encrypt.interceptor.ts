import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { EncryptService } from '../encrypt.service';
import { environment } from '../../../../environments/environment';

export const encryptHttpRequestInterceptor: HttpInterceptorFn = (req, next) => {
	const encryptService = inject(EncryptService);

	const ExcludeURLList = [
		environment.auth_url + '/auth/status',
		'https://api.ipify.org/?format=json',
	];

	const isExcluded = ExcludeURLList.some((url) => req.url.includes(url));

	if (!isExcluded) {
		if (!req.body && req.method === 'GET') {
			if (req.url.includes('?')) {
				const encryptedQuery = encryptService.encryptAES_Utf8(
					req.url.split('?')[1],
				);
				const encryptedUrl = req.url.split('?')[0] + '?' + encryptedQuery;

				req = req.clone({ url: encryptedUrl });
			}
		}
		else if (
			req.method === 'POST' ||
			req.method === 'PUT' ||
			req.method === 'DELETE'
		) {
			let updatedUrl = req.url;
			if (req.url.includes('?')) {
				const encryptedQuery = encryptService.encryptAES_Utf8(
					req.url.split('?')[1],
				);
				updatedUrl = req.url.split('?')[0] + '?' + encryptedQuery;
			}

			if (
				req.body &&
				(typeof req.body === 'string' || Array.isArray(req.body)) &&
				req.body.length > 0
			) {
				req = req.clone({
					body: encryptService.encryptAES_Utf8(req.body.toString()),
					url: updatedUrl,
					setHeaders: { 'Content-Type': 'application/json' },
				});
			}
			else if (req.body && typeof req.body === 'object') {
				// Encrypt object-based body
				req = req.clone({
					body: encryptService.encryptAES_Utf8(JSON.stringify(req.body)),
					url: updatedUrl,
					setHeaders: { 'Content-Type': 'application/json' },
				});
			}
			else {
				// Encrypt object-based body
				req = req.clone({
					url: updatedUrl,
					setHeaders: { 'Content-Type': 'application/json' },
				});
			}
		}
	}
	return next(req);
};