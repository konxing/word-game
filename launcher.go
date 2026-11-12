// Word Game offline Windows launcher. Build: GOOS=windows GOARCH=amd64 go build -ldflags="-H windowsgui" -o dist/打字小站.exe .
package main

import (
	"embed"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

//go:embed index.html styles.css app.js engine.js lessons.js assets/typing.ico
var gameFiles embed.FS

var staticFiles = []string{"index.html", "styles.css", "app.js", "engine.js", "lessons.js", "assets/typing.ico"}

func installDir() (string, error) {
	root := os.Getenv("LOCALAPPDATA")
	if root == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		root = filepath.Join(home, "AppData", "Local")
	}
	return filepath.Join(root, "TypingHarbor", "App"), nil
}

// Embedded pages are extracted to a stable local path so each launch keeps the same
// file:// origin and the existing browser profile's localStorage progress persists.
func extract(dir string) error {
	for _, name := range staticFiles {
		data, err := gameFiles.ReadFile(name)
		if err != nil {
			return err
		}
		target := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}
		temp := target + ".new"
		if err := os.WriteFile(temp, data, 0644); err != nil {
			return err
		}
		if err := os.Rename(temp, target); err != nil {
			// Windows cannot atomically replace an already existing file using Rename.
			_ = os.Remove(target)
			if err := os.Rename(temp, target); err != nil {
				return err
			}
		}
	}
	return nil
}

func findBrowser() string {
	candidates := []string{}
	for _, env := range []string{"PROGRAMFILES(X86)", "PROGRAMFILES", "LOCALAPPDATA"} {
		if base := os.Getenv(env); base != "" {
			candidates = append(candidates, filepath.Join(base, "Microsoft", "Edge", "Application", "msedge.exe"))
			candidates = append(candidates, filepath.Join(base, "Google", "Chrome", "Application", "chrome.exe"))
		}
	}
	for _, candidate := range candidates {
		if stat, err := os.Stat(candidate); err == nil && !stat.IsDir() {
			return candidate
		}
	}
	for _, exe := range []string{"msedge.exe", "chrome.exe", "msedge", "google-chrome"} {
		if candidate, err := exec.LookPath(exe); err == nil {
			return candidate
		}
	}
	return ""
}

func pageURL(path string) string {
	p := filepath.ToSlash(path)
	if runtime.GOOS == "windows" && !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	return (&url.URL{Scheme: "file", Path: p}).String()
}

func openGame() error {
	dir, err := installDir()
	if err != nil {
		return err
	}
	if err := extract(dir); err != nil {
		return fmt.Errorf("准备游戏资源失败: %w", err)
	}
	browser := findBrowser()
	if browser == "" {
		return errors.New("找不到 Microsoft Edge 或 Google Chrome，请先安装其中一种浏览器")
	}
	profile := filepath.Join(filepath.Dir(dir), "BrowserProfile")
	if err := os.MkdirAll(profile, 0755); err != nil {
		return err
	}
	target := pageURL(filepath.Join(dir, "index.html"))
	cmd := exec.Command(browser, "--user-data-dir="+profile, "--no-first-run", "--app="+target)
	return cmd.Start()
}

func main() {
	if err := openGame(); err != nil {
		// Native Windows message box without a GUI dependency.
		// PowerShell is included on supported Windows versions; errors are shown only on failure.
		message := strings.ReplaceAll(err.Error(), "'", "''")
		ps := "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('" + message + "','打字小站')"
		_ = exec.Command("powershell.exe", "-NoProfile", "-Command", ps).Run()
		os.Exit(1)
	}
}
