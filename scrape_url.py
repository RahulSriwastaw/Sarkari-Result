import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


def build_session():
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    return session


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url:
        raise ValueError("URL empty")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def fetch_and_parse(url: str, session: requests.Session):
    response = session.get(url, timeout=20)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    return response, soup


def make_clonable_html(soup: BeautifulSoup, base_url: str) -> str:
    for tag in soup.find_all(["a", "img", "link", "script", "source"], src=True):
        tag["src"] = urljoin(base_url, tag["src"])
    for tag in soup.find_all(["a", "link", "area"], href=True):
        tag["href"] = urljoin(base_url, tag["href"])
    return str(soup)


def extract_readable_text(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    candidates = []
    for selector in ["main", "article", "section", ".content", ".post", ".entry", "#content", "#main"]:
        selected = soup.select(selector)
        if not selected:
            continue
        for node in selected:
            text = " ".join(
                part.strip()
                for part in node.get_text("\n", strip=True).splitlines()
                if part.strip()
            )
            if len(text) > 120:
                candidates.append(text)

    if candidates:
        best_text = max(candidates, key=len)
    else:
        best_text = " ".join(soup.get_text(" ", strip=True).split())

    cleaned = re.sub(r"\s+", " ", best_text).strip()
    return cleaned[:15000]


def extract_title(soup: BeautifulSoup) -> str:
    title_tag = soup.title
    if title_tag and title_tag.get_text(strip=True):
        return title_tag.get_text(strip=True)
    return "Untitled"


def extract_meta(soup: BeautifulSoup) -> dict:
    meta = {}
    for tag in soup.find_all("meta"):
        name = tag.get("name") or tag.get("property")
        content = tag.get("content")
        if name and content:
            meta[name.lower()] = content
    return meta


def save_outputs(output_dir: Path, html_content: str, text_content: str, title: str, meta: dict, url: str):
    output_dir.mkdir(parents=True, exist_ok=True)

    clone_path = output_dir / "page_clone.html"
    text_path = output_dir / "extracted_text.txt"
    meta_path = output_dir / "meta.json"

    clone_path.write_text(html_content, encoding="utf-8")
    text_path.write_text(text_content, encoding="utf-8")
    meta_path.write_text(json.dumps({"url": url, "title": title, "meta": meta}, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "clone_html": str(clone_path),
        "extracted_text": str(text_path),
        "meta_json": str(meta_path),
    }


def scrape_url(url: str, output_dir: Path):
    session = build_session()
    normalized_url = normalize_url(url)
    response, soup = fetch_and_parse(normalized_url, session)

    clone_html = make_clonable_html(soup, normalized_url)
    title = extract_title(soup)
    text = extract_readable_text(soup)
    meta = extract_meta(soup)
    saved_files = save_outputs(output_dir, clone_html, text, title, meta, normalized_url)

    return {
        "url": normalized_url,
        "status_code": response.status_code,
        "title": title,
        "meta": meta,
        "text": text,
        "text_preview": text[:500],
        "saved_files": saved_files,
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape a webpage and save a clone + readable text")
    parser.add_argument("urls", nargs="*", help="One or more URLs to scrape")
    parser.add_argument("--output-dir", default="python_output", help="Folder to save the scraped output")
    args = parser.parse_args()

    output_dir = Path(__file__).resolve().parent / args.output_dir

    if not args.urls:
        url = input("Enter URL to scrape (or type 'exit'): ").strip()
        if url.lower() == "exit":
            sys.exit(0)
        args.urls = [url]

    for target_url in args.urls:
        try:
            result = scrape_url(target_url, output_dir)
            print(json.dumps(result, ensure_ascii=False, indent=2))
        except Exception as exc:
            print(json.dumps({"url": target_url, "error": str(exc)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
