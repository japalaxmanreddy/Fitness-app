"""Draw the home-screen icons. Run from the repo root: python3 scripts/make-icons.py"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public" / "icons"
INK = (240, 160, 106, 255)
BG = (29, 26, 22, 255)


def draw(size: int, maskable: bool) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if maskable:
        draw.rectangle((0, 0, size - 1, size - 1), fill=BG)
        scale = 0.46
    else:
        radius = int(size * 0.22)
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)
        scale = 0.62
    cx = size / 2
    cy = size / 2 + size * 0.02
    stroke = max(4, int(size * 0.045 * (0.85 if maskable else 1)))

    def p(x: float, y: float) -> tuple[float, float]:
        return (cx + x * size * scale, cy + y * size * scale)

    head = size * scale * 0.11
    hx, hy = p(0, -0.34)
    draw.ellipse((hx - head, hy - head, hx + head, hy + head), fill=INK)
    draw.line([p(0, -0.22), p(0, 0.05)], fill=INK, width=stroke)
    draw.line([p(-0.2, -0.08), p(0.2, -0.08)], fill=INK, width=stroke)
    draw.line([p(0, 0.05), p(-0.16, 0.34)], fill=INK, width=stroke)
    draw.line([p(0, 0.05), p(0.18, 0.28)], fill=INK, width=stroke)
    return image


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    draw(180, False).save(ROOT / "apple-touch-icon.png")
    draw(192, False).save(ROOT / "icon-192.png")
    draw(512, False).save(ROOT / "icon-512.png")
    draw(512, True).save(ROOT / "icon-maskable-512.png")


if __name__ == "__main__":
    main()
