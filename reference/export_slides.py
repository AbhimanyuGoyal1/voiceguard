import os
import sys

try:
    import win32com.client
    powerpoint = win32com.client.Dispatch("PowerPoint.Application")
    powerpoint.Visible = 1
    ppt_path = os.path.abspath(r"c:\src\projects\SIH\voiceguard\VoiceGuard_SIH2025_Submission_Portal_6Slides.pptx")
    deck = powerpoint.Presentations.Open(ppt_path)
    export_dir = os.path.abspath(r"c:\src\projects\SIH\voiceguard\reference\slide_previews")
    os.makedirs(export_dir, exist_ok=True)
    for i, slide in enumerate(deck.Slides):
        img_path = os.path.join(export_dir, f"slide_{i+1}.png")
        slide.Export(img_path, "PNG", 1920, 1080)
        print(f"Exported slide {i+1} to {img_path}")
    deck.Close()
    powerpoint.Quit()
    print("Export complete via PowerPoint COM!")
except Exception as e:
    print(f"PowerPoint COM export not available or failed: {e}")
