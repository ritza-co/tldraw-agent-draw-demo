MIT License

Copyright (c) 2024 tldraw Inc. (original tldraw Agent starter kit)
Copyright (c) 2026 Ritza (area-capture "Agent draw" modifications)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

This project is built on tldraw's official Agent starter kit
(https://github.com/tldraw/agent-template), which is MIT licensed. The starter-kit
portions remain under tldraw Inc.'s copyright above; the area-capture modifications
are under Ritza's copyright.

IMPORTANT, the MIT license above covers this repository's SOURCE CODE only, not the
tldraw SDK it depends on. This project depends on the `tldraw` SDK npm package, which
is distributed under the proprietary tldraw license
(https://github.com/tldraw/tldraw/blob/main/LICENSE.md), NOT MIT. Under that license:

- You may use the SDK freely in development.
- Using it in a production environment (any public/end-user-facing deployment)
  requires a tldraw license key. Options (see https://tldraw.dev/pricing):
  - 100-day free trial: production use, no watermark.
  - Free hobby license: for personal/prototype projects, shows a "made with tldraw"
    watermark on the canvas.
  - Commercial license: paid, for production products.
- The license key is passed via the SDK's `licenseKey` prop.

So you can clone, modify, and run this repo for free, but deploying the demo publicly
needs one of the tldraw licenses above.
