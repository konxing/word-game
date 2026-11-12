package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEmbeddedFilesExtracted(t *testing.T) {
	dir := t.TempDir()
	if err := extract(dir); err != nil {
		t.Fatal(err)
	}
	for _, name := range staticFiles {
		b, err := os.ReadFile(filepath.Join(dir, filepath.FromSlash(name)))
		if err != nil || len(b) == 0 {
			t.Fatalf("missing %s: %v", name, err)
		}
	}
	if err := extract(dir); err != nil {
		t.Fatalf("relaunch update failed: %v", err)
	}
}
func TestPageURL(t *testing.T) {
	u := pageURL(filepath.Join("folder with spaces", "index.html"))
	if !strings.HasPrefix(u, "file:") || !strings.Contains(u, "%20") {
		t.Fatal(u)
	}
}
