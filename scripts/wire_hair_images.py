import re, os, sys

ROOT = os.path.dirname(os.path.dirname(__file__))
INDEX = os.path.join(ROOT, "index.html")
assert os.path.exists(INDEX), "index.html not found"

with open(INDEX, "r", encoding="utf-8") as f:
    html = f.read()

changed = 0

# --- HERO: replace the Unsplash "Salon background" img with a <picture> using our hair hero ---
hero_pic = (
    '<picture>'
    '<source srcset="./images/work-hero.webp" type="image/webp">'
    '<img src="./images/work-hero.jpg" alt="Hair color bowls and tint brush on salon station" '
    'class="absolute inset-0 -z-10 h-full w-full object-cover opacity-30">'
    '</picture>'
)

# Prefer matching by alt (as shipped)
html_new, n = re.subn(r'<img[^>]+alt="Salon background"[^>]*>', hero_pic, html, flags=re.IGNORECASE)
if n == 0:
    # Fallback: any unsplash BG img with object-cover + absolute classes
    html_new, n = re.subn(r'<img[^>]+unsplash[^>]+object-cover[^>]+absolute[^>]*>', hero_pic, html, flags=re.IGNORECASE)
html, changed = html_new, changed + n

# --- BRIDAL SECTION: replace the second Unsplash image (alt="Bridal hair") with section picture ---
bridal_pic = (
    '<picture>'
    '<source srcset="./images/work-bridal.webp" type="image/webp">'
    '<img src="./images/work-bridal.jpg" alt="Formal updo — Brenda\'s work" '
    'class="w-full h-72 object-cover rounded-2xl">'
    '</picture>'
)
html_new, n = re.subn(r'<img[^>]+alt="Bridal hair"[^>]*>', bridal_pic, html, flags=re.IGNORECASE)
if n == 0:
    # Fallback: next remaining unsplash img (not the hero)
    html_new, n = re.subn(r'<img[^>]+unsplash[^>]*>', bridal_pic, html, count=1, flags=re.IGNORECASE)
html, changed = html_new, changed + n

# --- GALLERY: replace picsum placeholders with our 6 real images ---
# Replace the first four if they exist…
repls = [
    './images/work-g1.jpg',
    './images/work-g2.jpg',
    './images/work-g3.jpg',
    './images/work-g4.jpg',
]
def repl_iter(_m, counter={"i":0}):
    i = counter["i"]; counter["i"] += 1
    return f'src="{repls[i] if i < len(repls) else repls[-1]}"'
html, n = re.subn(r'src="https://picsum\.photos/seed/hair\d+/600/800"', repl_iter, html, flags=re.IGNORECASE)
changed += n

# If you want all 6 images shown, upgrade the grid and append two tiles if only 4 exist
if os.path.exists(os.path.join(ROOT, 'images', 'work-g5.jpg')) and os.path.exists(os.path.join(ROOT, 'images', 'work-g6.jpg')):
    # Make grid 3 cols on desktop
    html = re.sub(r'md:grid-cols-4', 'md:grid-cols-3', html)
    # Append two more tiles only if we still have exactly four work-g*.jpg references
    if len(re.findall(r'./images/work-g[1-6]\.jpg', html)) == 4:
        extra_tiles = '''
  <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
    <img src="./images/work-g5.jpg" alt="Vibrant violet & magenta color" class="h-full w-full object-cover">
  </div>
  <div class="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
    <img src="./images/work-g6.jpg" alt="Soft blonde layers" class="h-full w-full object-cover">
  </div>'''
        # insert before the closing grid </div> of the gallery section (the first match after "Gallery")
        gallery_start = re.search(r'<section[^>]*id="gallery"[^>]*>', html)
        if gallery_start:
            grid_match = re.search(r'(<div[^>]*class="[^"]*grid[^"]*"[^>]*>)(.*?)(</div>)', html[gallery_start.start():], flags=re.DOTALL)
            if grid_match:
                full = html[gallery_start.start():]
                pre = full[:grid_match.end(2)]
                post = html[gallery_start.start()+grid_match.end(2):]
                html = pre + extra_tiles + post

with open(INDEX, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Updated index.html (replacements made: {changed}).")
