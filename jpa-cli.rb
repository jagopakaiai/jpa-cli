class JpaCli < Formula
  desc "JPA CLI — AI agent rules synchronizer & workspace manager"
  homepage "https://github.com/jagopakaiai/jpa-cli"
  url "https://github.com/jagopakaiai/jpa-cli/releases/latest/download/jpa-cli-macos-x64"
  version "1.0.0"
  sha256 "replace-with-checksum-during-release"

  def install
    if Hardware::CPU.intel?
      bin.install "jpa-cli-macos-x64" => "jpa-cli"
    else
      bin.install "jpa-cli-macos-arm64" => "jpa-cli"
    end
  end

  test do
    system "#{bin}/jpa-cli", "--version"
  end
end
