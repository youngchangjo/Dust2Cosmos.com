"""Serve a loopback-only review of the static site; never publishes anything."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8893)
args = parser.parse_args()


class PreviewHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parts = Path(unquote(urlsplit(self.path).path)).parts
        if any(part.startswith('.') or part in ('docs', 'content', 'scripts', 'node_modules') for part in parts):
            self.send_error(404)
            return
        try:
            super().do_GET()
        except (BrokenPipeError, ConnectionResetError):
            pass  # A browser may cancel an image request during navigation.

    def log_request(self, code='-', size='-'):
        if str(code).startswith(('4', '5')):
            super().log_request(code, size)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Robots-Tag', 'noindex, nofollow')
        super().end_headers()


server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(PreviewHandler, directory=str(ROOT)))
print(f'Local review: http://127.0.0.1:{args.port}/ko/ (English: /)', flush=True)
server.serve_forever()
