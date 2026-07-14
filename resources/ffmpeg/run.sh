 ffmpeg -y -hide_banner -loglevel warning \
  -i c92a8e25-0d9b-4c46-be74-325689b3c422.m4a \
  -f lavfi -i "color=c=0x03070d:s=1280x720:r=24" \
  -filter_complex_script filter_fast.txt \
  -map '[vout]' -map '[aout]' -c:v libx264 -preset ultrafast -crf 24 -c:a aac -b:a 192k -movflags +faststart test_fast.mp4
