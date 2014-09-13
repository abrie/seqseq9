#!/bin/bash -e
AUDIO="samples.mp3"
TITLE="seqseq9 september"
ARTIST="manandjazz"
OUTPUT="output.mkv"
FONTFILE="/opt/X11/share/fonts/TTF/Vera.ttf"
ffmpeg -i $AUDIO -filter_complex "[0:a]avectorscope=s=640x518,pad=1280:720[vs]; [0:a]showspectrum=mode=separate:color=intensity:scale=cbrt:s=640x518[ss]; [0:a]showwaves=s=1280x202:mode=line[sw]; [vs][ss]overlay=w[bg]; [bg][sw]overlay=0:H-h,drawtext=fontfile=$FONTFILE:fontcolor=white:x=10:y=10:text='\"$TITLE\" by $ARTIST'[out]" -map "[out]" -map 0:a -c:v libx264 -preset fast -crf 18 -c:a copy $OUTPUT 
