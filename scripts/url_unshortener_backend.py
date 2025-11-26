"""Flask backend for expanding shortened URLs.

Run with `python scripts/url_unshortener_backend.py` and ensure the `requests`
package is installed in your environment.
"""
from __future__ import annotations

from flask import Flask, jsonify, request
import requests

app = Flask(__name__)


def extract_shorturl(short_url: str):
    """Expand a shortened URL and return the final destination and redirects."""
    try:
        response = requests.get(short_url, allow_redirects=False)
        redirection_links = []

        while "Location" in response.headers:
            redirect_url = response.headers["Location"]
            redirection_links.append(redirect_url)
            response = requests.get(redirect_url, allow_redirects=False)

        final_link = response.url
        redirection_links.append(final_link)
        return final_link, redirection_links
    except requests.exceptions.RequestException as error:
        return None, [f"Error fetching the URL: {error}"]


@app.route("/extract", methods=["GET"])
def extract():
    short_url = request.args.get("url")
    if not short_url:
        return jsonify({"error": "No URL provided"}), 400

    full_link, all_links = extract_shorturl(short_url)
    if full_link is None:
        return jsonify({"error": "Failed to expand the URL", "details": all_links}), 500

    return jsonify(
        {
            "Original URL": short_url,
            "Full Link": full_link,
            "All Possible Redirections": all_links,
        }
    )


if __name__ == "__main__":
    app.run()
