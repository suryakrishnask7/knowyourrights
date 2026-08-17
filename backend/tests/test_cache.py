import os
import sys
import asyncio
import unittest
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.cache import make_cache_key, get_cached_response, set_cached_response, get_corpus_version

class TestResponseCache(unittest.TestCase):
    def test_make_cache_key_paraphrase_collapse(self):
        # Paraphrased queries with the same category, jurisdiction, and missing facts must produce identical keys
        key1 = make_cache_key("unpaid_wages", "TN", ["period of unpaid wages", "written contract"])
        key2 = make_cache_key("unpaid_wages", "TN", ["written contract", "period of unpaid wages"])
        self.assertEqual(key1, key2, "Sorting of missing facts must ensure identical cache keys")

        # Different state or category must produce different keys
        key3 = make_cache_key("unpaid_wages", "MH", ["period of unpaid wages", "written contract"])
        self.assertNotEqual(key1, key3)

    def test_set_cached_response_low_evidence_rejection(self):
        # Must reject Low evidence responses at code level
        with self.assertRaises(ValueError):
            asyncio.run(set_cached_response(
                cache_key="test_low_key",
                category="unpaid_wages",
                jurisdiction="TN",
                corpus_version=1,
                response={"answer": "Low evidence test"},
                evidence_level="Low"
            ))

    def test_cache_roundtrip_and_version_invalidation(self):
        key = make_cache_key("test_cat", "TN", ["fact1"])
        test_response = {"answer": "Test cached legal answer", "citations": []}
        
        # Store with corpus_version 1
        asyncio.run(set_cached_response(
            cache_key=key,
            category="test_cat",
            jurisdiction="TN",
            corpus_version=1,
            response=test_response,
            evidence_level="High"
        ))
        
        # Read back with version 1 -> Must HIT
        hit = asyncio.run(get_cached_response(key, corpus_version=1))
        self.assertIsNotNone(hit)
        self.assertEqual(hit["answer"], "Test cached legal answer")
        
        # Read back with version 2 -> Must MISS (stale version invalidation)
        miss = asyncio.run(get_cached_response(key, corpus_version=2))
        self.assertIsNone(miss, "Bumping corpus_version must treat previously cached entry as a miss")

if __name__ == "__main__":
    unittest.main()
