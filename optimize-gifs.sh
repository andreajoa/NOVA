#!/bin/bash
cd ~/downloads/nova/public/emails/gifs

for n in 1 2 3 4; do
  echo "Processando clip $n..."
  ffmpeg -y -loglevel error -t 4 -i day3-clip-$n.gif -vf "fps=8,scale=320:-1:flags=lanczos,palettegen=stats_mode=diff" palette$n.png
  ffmpeg -y -loglevel error -t 4 -i day3-clip-$n.gif -i palette$n.png -lavfi "fps=8,scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" -loop 0 day3-clip-$n-opt.gif
  rm -f palette$n.png
done

ls -lh day3-clip-*-opt.gif
