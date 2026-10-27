#!/bin/bash
# Fetches the full GeneralUser GS 2.0.3 bank (32 MB) at the pinned commit, only needed to rebuild
# public/soundbank/counterpart-piano.sf2 with `npm run soundbank`.
set -e
cd "$(dirname "$0")/.."
dir=content/vendor/generaluser-gs
tmp=$(mktemp -d)
git clone --filter=blob:none --no-checkout https://github.com/mrbumpy409/GeneralUser-GS.git "$tmp/gugs"
git -C "$tmp/gugs" checkout 684543d5e5efaef08d02be50dcda8d552478fa60 -- GeneralUser-GS.sf2 documentation/LICENSE.txt
cp "$tmp/gugs/GeneralUser-GS.sf2" "$dir/"
cp "$tmp/gugs/documentation/LICENSE.txt" "$dir/LICENSE.txt"
rm -rf "$tmp"
echo "GeneralUser GS fetched into $dir"
