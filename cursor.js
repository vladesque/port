(function () {
  const r = (x, y, w, h, f) =>
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + f + '"/>';

  function cur(content, hx, hy) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' + content + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + hx + ' ' + hy + ', auto';
  }

  // 8-bit Camera
  const camera = cur(
    r(4,4,4,6,'#fff')  + r(14,4,4,6,'#fff') +   // viewfinder bumps
    r(2,8,22,16,'#fff') +                          // body outline
    r(4,10,18,12,'#1a1a1a') +                      // body interior
    r(8,12,12,8,'#333') +                          // lens outer
    r(10,14,8,4,'#555') +                          // lens inner
    r(12,16,4,2,'#999') +                          // lens highlight
    r(20,10,2,2,'#d4a853'),                        // flash (gold)
    0, 0
  );

  // 8-bit Scissors
  const s = '#ddd';
  const scissors = cur(
    // blade \ (top-left to bottom-right)
    r(0,0,4,4,s)   + r(4,4,4,4,s)   + r(8,8,4,4,s) +
    r(20,20,4,4,s) + r(24,24,4,4,s) + r(28,28,4,4,s) +
    // blade / (top-right to bottom-left)
    r(28,0,4,4,s)  + r(24,4,4,4,s)  + r(20,8,4,4,s) +
    r(8,20,4,4,s)  + r(4,24,4,4,s)  + r(0,28,4,4,s) +
    // pivot
    r(12,12,8,8,'#fff') + r(14,14,4,4,'#777'),
    16, 16
  );

  // 8-bit Pen (diagonal, tip at bottom-left)
  const pen = cur(
    r(24,0,4,4,'#e8d090') +                       // cap
    r(22,2,4,4,'#d4a853') + r(20,4,4,4,'#d4a853') +
    r(18,6,4,4,'#d4a853') + r(16,8,4,4,'#d4a853') +
    r(14,10,4,4,'#d4a853') + r(12,12,4,4,'#d4a853') +
    r(10,14,4,4,'#d4a853') + r(8,16,4,4,'#c89640') + // body
    r(6,18,4,4,'#aaa')  + r(4,20,4,4,'#888') +    // nib
    r(2,22,4,4,'#555')  + r(0,24,2,6,'#222'),      // tip
    0, 28
  );

  const list = [camera, scissors, pen];
  let i = 0;

  function step() {
    document.body.style.cursor = list[i];
    i = (i + 1) % list.length;
  }

  step();
  setInterval(step, 5000);
})();
