"""Render the Google 'G' mark to PNG so the provider buttons can use
expo-image instead of react-native-svg (whose native view swallows taps on
Android)."""

from PIL import Image, ImageDraw

S = 512
SS = 4
W = S * SS

COLORS = {
    "blue": (66, 133, 244),
    "green": (52, 168, 83),
    "yellow": (251, 188, 4),
    "red": (234, 67, 53),
}

img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

cx = cy = W / 2
r = W * 0.40
width = W * 0.20

# The G is a ring with four coloured arcs. Angles are degrees, measured
# clockwise from 3 o'clock, and drawn as thick arcs.
arcs = [
    ("red", -12, 48),      # bottom right
    ("yellow", 48, 116),   # bottom
    ("green", 116, 214),   # left and top
    ("blue", 214, 348),    # top and right
]

for name, start, end in arcs:
    d.arc(
        (cx - r, cy - r, cx + r, cy + r),
        start=start,
        end=end,
        fill=COLORS[name] + (255,),
        width=int(width),
    )

# Blue horizontal bar of the G (the crossbar pointing inwards).
bar_h = width
bar_w = W * 0.30
d.rectangle(
    (cx, cy - bar_h / 2, cx + bar_w, cy + bar_h / 2),
    fill=COLORS["blue"] + (255,),
)

img = img.resize((S, S), Image.LANCZOS)
out = r"D:\真实开发测试Yohaku\二次修复\dsh\repo\apps\mobile\assets\social\google.png"
img.save(out)
print("wrote", out, img.size)
