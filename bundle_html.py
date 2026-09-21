import os

base_dir = r"c:\Users\USER\Desktop\New folder (2)\New folder\abdul2\quran\backend_php"
template_path = os.path.join(base_dir, "public", "index.template.html")
html_path = os.path.join(base_dir, "public", "index.html")
root_html_path = os.path.join(base_dir, "index.html")

css_path = os.path.join(base_dir, "public", "static", "css", "style.css")
api_path = os.path.join(base_dir, "public", "static", "js", "api.js")
player_path = os.path.join(base_dir, "public", "static", "js", "audio_player.js")
recorder_path = os.path.join(base_dir, "public", "static", "js", "audio_recorder.js")
platform_path = os.path.join(base_dir, "public", "static", "js", "platform.js")
app_path = os.path.join(base_dir, "public", "static", "js", "app.js")

with open(template_path, "r", encoding="utf-8") as f:
    template = f.read()

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

with open(api_path, "r", encoding="utf-8") as f:
    api_js = f.read()

with open(player_path, "r", encoding="utf-8") as f:
    player_js = f.read()

with open(recorder_path, "r", encoding="utf-8") as f:
    recorder_js = f.read()

with open(platform_path, "r", encoding="utf-8") as f:
    platform_js = f.read()

with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

css_block = f"""  <style>
{css}
  </style>"""

js_block = f"""  <script>
{api_js}
  </script>
  <script>
{player_js}
  </script>
  <script>
{recorder_js}
  </script>
  <script>
{platform_js}
  </script>
  <script>
{app_js}
  </script>"""

bundled = template.replace("<!-- INLINE_CSS_PLACEHOLDER -->", css_block)
bundled = bundled.replace("<!-- INLINE_JS_PLACEHOLDER -->", js_block)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(bundled)

with open(root_html_path, "w", encoding="utf-8") as f:
    f.write(bundled)

vercel_public_dir = os.path.join(os.path.dirname(base_dir), "public")
os.makedirs(vercel_public_dir, exist_ok=True)
vercel_html_path = os.path.join(vercel_public_dir, "index.html")
with open(vercel_html_path, "w", encoding="utf-8") as f:
    f.write(bundled)

print("HTML Bundled successfully!")
print("Size:", len(bundled), "bytes")
