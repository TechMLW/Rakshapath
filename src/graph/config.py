from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GRAPH_DIR = REPO_ROOT / "data" / "graphs"
NETWORK_TYPE = "drive"

NORTHEAST_STATES = [
    "Assam, India",
    "Meghalaya, India",
    "Arunachal Pradesh, India",
    "Nagaland, India",
    "Manipur, India",
    "Mizoram, India",
    "Tripura, India",
    "Sikkim, India",
]

REGIONS = {
    "bhubaneswar": {
        "name": "Bhubaneswar",
        "place_name": "Bhubaneswar, Odisha, India",
        "filename": "bhubaneswar_drive.graphml",
        "path": GRAPH_DIR / "bhubaneswar_drive.graphml",
        "sample_origin": (20.2961, 85.8245),
        "sample_destination": (20.3537, 85.8195),
    },
    "assam": {
        "name": "Assam",
        "place_name": "Assam, India",
        "filename": "assam_drive.graphml",
        "path": GRAPH_DIR / "assam_drive.graphml",
        "sample_origin": (26.1445, 91.7362),
        "sample_destination": (26.1408, 91.7903),
    },
    "meghalaya": {
        "name": "Meghalaya",
        "place_name": "Meghalaya, India",
        "filename": "meghalaya_drive.graphml",
        "path": GRAPH_DIR / "meghalaya_drive.graphml",
        "sample_origin": (25.5788, 91.8933),
        "sample_destination": (25.2986, 91.5822),
    },
    "arunachal_pradesh": {
        "name": "Arunachal Pradesh",
        "place_name": "Arunachal Pradesh, India",
        "filename": "arunachal_pradesh_drive.graphml",
        "path": GRAPH_DIR / "arunachal_pradesh_drive.graphml",
        "sample_origin": (27.0844, 93.6053),
        "sample_destination": (27.0987, 93.6325),
    },
    "nagaland": {
        "name": "Nagaland",
        "place_name": "Nagaland, India",
        "filename": "nagaland_drive.graphml",
        "path": GRAPH_DIR / "nagaland_drive.graphml",
        "sample_origin": (25.6751, 94.1086),
        "sample_destination": (25.9068, 93.7273),
    },
    "manipur": {
        "name": "Manipur",
        "place_name": "Manipur, India",
        "filename": "manipur_drive.graphml",
        "path": GRAPH_DIR / "manipur_drive.graphml",
        "sample_origin": (24.8170, 93.9368),
        "sample_destination": (24.4960, 93.7865),
    },
    "mizoram": {
        "name": "Mizoram",
        "place_name": "Mizoram, India",
        "filename": "mizoram_drive.graphml",
        "path": GRAPH_DIR / "mizoram_drive.graphml",
        "sample_origin": (23.7271, 92.7176),
        "sample_destination": (23.7460, 92.6840),
    },
    "tripura": {
        "name": "Tripura",
        "place_name": "Tripura, India",
        "filename": "tripura_drive.graphml",
        "path": GRAPH_DIR / "tripura_drive.graphml",
        "sample_origin": (23.8315, 91.2868),
        "sample_destination": (23.5350, 91.4880),
    },
    "sikkim": {
        "name": "Sikkim",
        "place_name": "Sikkim, India",
        "filename": "sikkim_drive.graphml",
        "path": GRAPH_DIR / "sikkim_drive.graphml",
        "sample_origin": (27.3389, 88.6065),
        "sample_destination": (27.1670, 88.3630),
    },
    "northeast": {
        "name": "North East (Combined)",
        "place_name": NORTHEAST_STATES,
        "filename": "northeast_drive.graphml",
        "path": GRAPH_DIR / "northeast_drive.graphml",
        "sample_origin": (26.1445, 91.7362),
        "sample_destination": (25.5788, 91.8933),
    },
}

DEFAULT_REGION = "bhubaneswar"
PLACE_NAME = REGIONS[DEFAULT_REGION]["place_name"]
GRAPHML_PATH = REGIONS[DEFAULT_REGION]["path"]



