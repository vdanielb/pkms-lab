/** Parse a single CSV line, respecting quoted fields. */
function parseCSVLine(line: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const next = line[i + 1];

		if (char === '"') {
			if (inQuotes && next === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === ',' && !inQuotes) {
			values.push(current);
			current = '';
			continue;
		}

		current += char;
	}

	values.push(current);
	return values;
}

export function parseCSV(text: string): Record<string, string>[] {
	const lines = text.trim().split(/\r?\n/);
	if (lines.length < 2) return [];

	const headers = parseCSVLine(lines[0]);
	return lines.slice(1).flatMap((line) => {
		if (!line.trim()) return [];
		const values = parseCSVLine(line);
		return [
			Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] ?? '').trim()])),
		];
	});
}
