class JagopakaiaiCli < Formula
  desc "JagoPakaiAI CLI rules configuration manager"
  homepage "https://github.com/jagopakaiai/jagopakaiAI-cli"
  url "https://github.com/jagopakaiai/jagopakaiAI-cli/releases/latest/download/jagopakaiai-cli-macos-x64"
  version "1.0.0"
  sha256 "replace-with-checksum-during-release"

  def install
    if Hardware::CPU.intel?
      bin.install "jagopakaiai-cli-macos-x64" => "jagopakaiai-cli"
    else
      bin.install "jagopakaiai-cli-macos-arm64" => "jagopakaiai-cli"
    end
  end

  test do
    system "#{bin}/jagopakaiai-cli", "--version"
  end
end
