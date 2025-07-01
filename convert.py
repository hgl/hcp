#!/usr/bin/env python3

import sys
import json
from pprint import pprint
import networkx as nx
from networkx.readwrite import json_graph

G = nx.read_graphml(sys.argv[1]).to_undirected()

result = {}
for researcher in G.nodes:
    if not str(researcher).startswith("('Researcher',"):
        continue
    # Extract researcher id
    rid = str(researcher).split(", ", 1)[1].rsplit("'", 2)[1]
    # Book publications
    book_pubs = [n for n in G.neighbors(researcher) if str(n).startswith("('BookPublication',")]
    book_pub_ids = [str(n).split(", ", 1)[1].rsplit("'", 2)[1] for n in book_pubs]
    # Other publications
    other_pubs = [n for n in G.neighbors(researcher) if str(n).startswith("('OtherPublication',")]
    other_pub_ids = [str(n).split(", ", 1)[1].rsplit("'", 2)[1] for n in other_pubs]
    # Coauthors: dict with id and copubs (shared pub dicts)
    coauthor_copubs = {}
    for pub in book_pubs + other_pubs:
        pub_str = str(pub)
        pub_id = pub_str.split(", ", 1)[1].rsplit("'", 2)[1]
        pub_type = 'bookPub' if pub_str.startswith("('BookPublication',") else 'otherPub'
        pub_dict = {"type": pub_type, "id": pub_id}
        for n in G.neighbors(pub):
            if str(n).startswith("('Researcher',") and n != researcher:
                coauthor_id = str(n).split(", ", 1)[1].rsplit("'", 2)[1]
                coauthor_copubs.setdefault(coauthor_id, []).append(pub_dict)
    # correctly we only need to know the number of copubs
    coauthors = [{"id": cid, "numCopub": len(pubs)} for cid, pubs in coauthor_copubs.items()]
    result[rid] = {
        "id": rid,
        "bookPubs": book_pub_ids,
        "otherPubs": other_pub_ids,
        "coauthors": coauthors
    }

with open(sys.argv[2], "w") as f:
    json.dump(result, f, indent=2)

# Find the researcher with the max number of coauthors
if result:
    max_id = max(result, key=lambda rid: len(result[rid]["coauthors"]))
    # Recursively collect all reachable researchers via coauthors
    visited = set()
    subgraph = {}
    def dfs(rid):
        if rid in visited:
            return
        visited.add(rid)
        subgraph[rid] = result[rid]
        for co in result[rid]["coauthors"]:
            coid = co["id"]
            if coid in result:
                dfs(coid)
    dfs(max_id)
    with open(sys.argv[3], "w") as f:
        json.dump({"maxId": max_id, "researchers": subgraph}, f, indent=2)


