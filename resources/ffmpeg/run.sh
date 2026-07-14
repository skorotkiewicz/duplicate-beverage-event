 ffmpeg -y -hide_banner -loglevel warning \
  -i input_audio.m4a \
  -f lavfi -i "color=c=0x03070d:s=1280x720:r=24" \
  -filter_complex_script filter_fast.txt \
  -map '[vout]' -map '[aout]' -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 192k -movflags +faststart output.mp4
