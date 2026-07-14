    const fs = require('fs');
    const file = 'resources/index.html';
    const html = fs.readFileSync(file, 'utf8');
    const vtt = fs.readFileSync('resources/story.vtt', 'utf8');

    const normalizeWords = (text) => text
      .replace(/[“”]/g, '"')
      .replace(/[’']/g, '')
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const toSeconds = (stamp) => {
      const [h, m, s] = stamp.replace(',', '.').split(':');
      return Number(h) * 3600 + Number(m) * 60 + Number(s);
    };

    const timedWords = [];
    for (const block of vtt.split(/\n\s*\n/)) {
      const lines = block.trim().split(/\n/).filter(Boolean);
      const timingIndex = lines.findIndex((line) => line.includes('-->'));
      if (timingIndex === -1) continue;

      const [startRaw, endRaw] = lines[timingIndex].split('-->').map((part) => part.trim().split(/\s+/)[0]);
      const words = normalizeWords(lines.slice(timingIndex + 1).join(' '));
      if (!words.length) continue;

      const start = toSeconds(startRaw);
      const end = toSeconds(endRaw);
      const span = end - start;

      words.forEach((word, index) => {
        timedWords.push({
          word,
          start: start + span * (index / words.length),
          end: start + span * ((index + 1) / words.length),
        });
      });
    }

    const sectionRe = /(<div class="story__body">\n)([\s\S]*?)(\n        <\/div>)/;
    const section = html.match(sectionRe);
    if (!section) throw new Error('story body not found');

    const segmentRe = /<(p|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/g;
    const segments = [...section[2].matchAll(segmentRe)].map((match) => ({
      tag: match[1],
      attrs: match[2],
      html: match[3],
      words: normalizeWords(match[3]),
    })).filter((segment) => segment.words.length);

    const findExact = (words, from, until = timedWords.length) => {
      for (let i = from; i <= until - words.length; i++) {
        let ok = true;
        for (let j = 0; j < words.length; j++) {
          if (timedWords[i + j].word !== words[j]) {
            ok = false;
            break;
          }
        }
        if (ok) return i;
      }
      return -1;
    };

    const timings = [];
    let cursor = 0;
    let fuzzy = 0;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      let found = findExact(segment.words, cursor);

      if (found === -1) {
        let nextFound = -1;
        for (let next = i + 1; next < segments.length; next++) {
          nextFound = findExact(segments[next].words, cursor);
          if (nextFound !== -1) break;
        }

        if (nextFound === -1 || nextFound <= cursor) {
          throw new Error(`Could not align segment ${i + 1}: ${segment.words.slice(0, 8).join(' ')}`);
        }

        timings.push({ start: timedWords[cursor].start, end: timedWords[nextFound - 1].end, fuzzy: true });
        cursor = nextFound;
        fuzzy++;
        continue;
      }

      timings.push({
        start: timedWords[found].start,
        end: timedWords[found + segment.words.length - 1].end,
        fuzzy: false,
      });
      cursor = found + segment.words.length;
    }

    let index = 0;
    const body = section[2].replace(segmentRe, (full, tag, attrs, content) => {
      const words = normalizeWords(content);
      if (!words.length) return full;
      const timing = timings[index++];
      const cleanAttrs = attrs
        .replace(/\sdata-start="[^"]*"/g, '')
        .replace(/\sdata-end="[^"]*"/g, '');
      return `<${tag}${cleanAttrs} data-start="${timing.start.toFixed(2)}" data-end="${timing.end.toFixed(2)}">${content}</${tag}>`;
    });

    fs.writeFileSync(file, html.replace(sectionRe, `$1${body}$3`));
    console.log(`aligned ${segments.length} story segments from VTT (${fuzzy} fuzzy span)`);
