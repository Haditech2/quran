/** Remove simple HTML tags from API translation text. */
export function stripHtml(value: string): string {
	return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
