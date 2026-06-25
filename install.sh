#!/usr/bin/env sh
set -e

OWNER="jagopakaiai"
REPO="jagopakaiAI-cli"
BINARY="jagopakaiai-cli"

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin)
    if [ "$ARCH" = "arm64" ]; then
      SUFFIX="macos-arm64"
    else
      SUFFIX="macos-x64"
    fi
    ;;
  linux)
    SUFFIX="linux-x64"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

URL="https://github.com/$OWNER/$REPO/releases/latest/download/${BINARY}-${SUFFIX}"
DEST="/usr/local/bin/$BINARY"

echo "Downloading $BINARY for $OS-$ARCH..."
curl -L "$URL" -o "$BINARY"
chmod +x "$BINARY"

echo "Installing to $DEST (requires sudo)..."
sudo mv "$BINARY" "$DEST"
echo "JagoPakaiAI CLI installed successfully!"
