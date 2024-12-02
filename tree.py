import requests


def fetch_links(title, depth, max_depth):
    if depth > max_depth:
        return []

    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "prop": "links",
        "titles": title,
        "pllimit": "10",
    }
    response = requests.get(url, params=params).json()
    pages = response.get("query", {}).get("pages", {})
    children = []

    for page_id, page_data in pages.items():
        if "links" in page_data:
            for link in page_data["links"]:
                link_title = link["title"]
                children.append(
                    {
                        "name": link_title,
                        "children": fetch_links(link_title, depth + 1, max_depth),
                    }
                )

    return children


# Start building the hierarchy
root_title = "Analytics"
max_depth = 1
tree = {"name": root_title, "children": fetch_links(root_title, 0, max_depth)}

print(tree)
