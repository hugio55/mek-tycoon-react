import json

# Load frequency data
with open(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react\public\mek-images\150px\freq_data.json") as f:
    freq_data = json.load(f)

body_freq = freq_data['body_frequencies']
head_freq = freq_data['head_frequencies']
trait_freq = freq_data['trait_frequencies']

# Current variation data from COMPLETE_VARIATION_RARITY
# Format: (id, name, type, count, current_sourceKey)
variations = [
    # Special variations (numeric sourceKeys - keep unchanged)
    (2, "Derelict", "head", 1, "000H"),
    (109, "Gatsby Ultimate", "body", 1, "000B"),
    (221, "Stolen", "trait", 1, "000T"),
    (7, "Obliterator", "head", 1, "999H"),
    (111, "Luxury Ultimate", "body", 1, "999B"),
    (215, "Golden Guns Ultimate", "trait", 1, "999T"),
    (4, "Ellie Mesh", "head", 1, "888H"),
    (105, "Chrome Ultimate", "body", 1, "888B"),
    (222, "Vanished", "trait", 1, "888T"),
    (10, "Projectionist", "head", 1, "777H"),
    (106, "Cousin Itt", "body", 1, "777B"),
    (216, "Gone", "trait", 1, "777T"),
    (9, "Pie", "head", 1, "666H"),
    (104, "Carving Ultimate", "body", 1, "666B"),
    (219, "Oompah", "trait", 1, "666T"),
    (5, "Frost King", "head", 1, "555H"),
    (107, "Frost Cage", "body", 1, "555B"),
    (289, "Nil", "trait", 1, "555T"),
    (8, "Paul Ultimate", "head", 1, "444H"),
    (103, "Burnt Ultimate", "body", 1, "444B"),
    (290, "Null", "trait", 1, "444T"),
    (3, "Discomania", "head", 1, "333H"),
    (113, "X Ray Ultimate", "body", 1, "333B"),
    (291, "None", "trait", 1, "333T"),
    (1, "Ace of Spades Ultimate", "head", 1, "222H"),
    (112, "Plush Ultimate", "body", 1, "222B"),
    (218, "Linkinator 3000", "trait", 1, "222T"),
    (6, "Nyan Ultimate", "head", 1, "111H"),
    (110, "Heatwave Ultimate", "body", 1, "111B"),
    (220, "Peacock Ultimate", "trait", 1, "111T"),

    # Regular variations (alphabetic sourceKeys - need matching)
    (108, "Fury", "body", 1, "BW5"),
    (217, "King Tut", "trait", 1, "AZ3"),
    (11, "Ross", "head", 1, "LZ2"),
    (114, "007", "body", 2, "CX2"),
    (115, "Cartoon", "body", 2, "AA5"),
    (116, "Heatwave", "body", 2, "CX2"),
    (117, "Luxury", "body", 2, "DS3"),
    (118, "Majesty", "body", 2, "DC4"),
    (119, "Oil", "body", 2, "BF5"),
    (223, "Peacock", "trait", 2, "AZ4"),
    (120, "Seabiscuit", "body", 2, "KY4"),
    (12, "Acid", "head", 3, "DP4"),
    (121, "Gatsby", "body", 3, "DC4"),
    (13, "Gold", "head", 3, "IV1"),
    (224, "Palace", "trait", 3, "AZ2"),
    (122, "Pearl", "body", 3, "ER3"),
    (123, "Spaghetti", "body", 3, "AA2"),
    (124, "Tarpie", "body", 3, "DS1"),
    (125, "Cartoonichrome", "body", 4, "AA1"),
    (225, "Drip", "trait", 4, "EY3"),
    (126, "Granite", "body", 4, "BQ1"),
    (14, "Lazer", "head", 4, "BC1"),
    (226, "Test Track", "trait", 4, "AW3"),
    (127, "Tie Dye", "body", 4, "BJ3"),
    (15, "Wires", "head", 4, "FS1"),
    (128, "Burnt", "body", 5, "DS2"),
    (129, "Damascus", "body", 5, "BW2"),
    (130, "Giger", "body", 5, "AA1"),
    (131, "Maze", "body", 5, "BJ1"),
    (16, "Nightstalker", "head", 5, "AE1"),
    (17, "Nyan", "head", 5, "AK3"),
    (18, "Paul", "head", 5, "AA1"),
    (19, "Pizza", "head", 5, "CF3"),
    (227, "Screamo", "trait", 5, "KQ3"),
    (20, "Terminator", "head", 5, "AA1"),
    (21, "24K", "head", 6, "AA1"),
    (132, "Bag", "body", 6, "DM1"),
    (228, "Blasters", "trait", 6, "CU3"),
    (22, "China", "head", 6, "CF1"),
    (133, "Nuggets", "body", 6, "AK2"),
    (134, "Radiance", "body", 6, "AA1"),
    (229, "Spectrum", "trait", 6, "EV3"),
    (23, "Stained Glass", "head", 6, "CF1"),
    (24, "The Lethal Dimension", "head", 6, "BC1"),
    (230, "2001", "trait", 7, "EY2"),
    (231, "Crow", "trait", 7, "AZ1"),
    (135, "Jolly Rancher", "body", 7, "AA1"),
    (25, "Magma", "head", 7, "AA1"),
    (136, "Shipped", "body", 7, "AK1"),
    (26, "???", "head", 8, "AR1"),
    (232, "Hydra", "trait", 8, "AP3"),
    (137, "Lord", "body", 8, "AK3"),
    (27, "Silicon", "head", 8, "AK1"),
    (138, "X Ray", "body", 8, "BI1"),
    (28, "Bone Daddy", "head", 9, "HB1"),
    (29, "Bowling", "head", 9, "CF2"),
    (139, "OE Light", "body", 9, "AA2"),
    (140, "Peppermint", "body", 9, "CB3"),
    (30, "Snow", "head", 9, "GG1"),
    (31, "The Ram", "head", 10, "AE1"),
    (32, "Whiskey", "head", 10, "AK1"),
    (33, "Arcade", "head", 11, "HB2"),
    (141, "Blood", "body", 11, "CB3"),
    (233, "Carbonite", "trait", 11, "EY1"),
    (34, "Mint", "head", 11, "AE1"),
    (35, "Bubblegum", "head", 12, "CF3"),
    (234, "Iced", "trait", 12, "BR3"),
    (142, "Seafoam", "body", 12, "DC1"),
    (36, "Ballerina", "head", 13, "HB2"),
    (235, "Icon", "trait", 13, "EV2"),
    (143, "Ocean", "body", 13, "BF1"),
    (236, "Splatter", "trait", 13, "GK3"),
    (37, "Heatmap", "head", 14, "BC1"),
    (38, "Acrylic", "head", 15, "HB2"),
    (144, "Carving", "body", 15, "FD2"),
    (237, "Holographic", "trait", 15, "AS3"),
    (145, "Rug", "body", 15, "BJ2"),
    (146, "Trapped", "body", 15, "AA3"),
    (147, "Frosted", "body", 16, "AA3"),
    (39, "Quilt", "head", 16, "GQ2"),
    (238, "Ring Red", "trait", 16, "DA3"),
    (40, "Ornament", "head", 17, "AE1"),
    (41, "Sleet", "head", 18, "HH1"),
    (148, "Sticky", "body", 18, "BF1"),
    (239, "Tactical", "trait", 19, "DE3"),
    (149, "Vapor", "body", 19, "BF3"),
    (42, "Hades", "head", 20, "AE1"),
    (150, "Inner Rainbow", "body", 20, "DM1"),
    (43, "Drill", "head", 21, "AM1"),
    (151, "Frostbit", "body", 21, "AA2"),
    (240, "Nuclear", "trait", 21, "HN3"),
    (44, "Cotton Candy", "head", 22, "ED1"),
    (241, "Foil", "trait", 22, "AJ3"),
    (45, "Mesh", "head", 22, "BC3"),
    (46, "Tron", "head", 22, "CF3"),
    (47, "Ace of Spades", "head", 23, "AE2"),
    (152, "Denim", "body", 23, "AA1"),
    (242, "Golden Guns", "trait", 23, "CU2"),
    (48, "Mars Attacks", "head", 23, "HB2"),
    (49, "Dualtone", "head", 24, "BC4"),
    (50, "Flaked", "head", 24, "AA2"),
    (243, "LV-426", "trait", 25, "AW2"),
    (244, "Sap", "trait", 25, "BC3"),
    (153, "Stars", "body", 25, "BJ2"),
    (154, "White", "body", 25, "BF1"),
    (245, "Bling", "trait", 26, "MX1"),
    (51, "Electrik", "head", 26, "AA1"),
    (52, "Hal", "head", 26, "HB1"),
    (246, "R&B", "trait", 27, "KQ2"),
    (247, "Earth", "trait", 28, "AW1"),
    (248, "Jeff", "trait", 28, "EH3"),
    (249, "Purplex", "trait", 28, "MT2"),
    (53, "Recon", "head", 28, "HB1"),
    (155, "Doom", "body", 30, "BJ1"),
    (156, "Journey", "body", 30, "AK1"),
    (250, "Just Wren", "trait", 30, "EV1"),
    (157, "Mercury", "body", 30, "BF1"),
    (251, "Angler", "trait", 31, "AS2"),
    (158, "Stone", "body", 31, "AK3"),
    (159, "Tiles", "body", 31, "BF1"),
    (160, "Soul", "body", 32, "BF1"),
    (54, "Sun", "head", 32, "AA2"),
    (161, "Lizard", "body", 33, "BF1"),
    (55, "Sterling", "head", 33, "HH1"),
    (162, "Cheetah", "body", 34, "BF1"),
    (56, "Lich", "head", 34, "HB2"),
    (252, "Phoenix", "trait", 34, "AP2"),
    (163, "Sunset", "body", 34, "BI1"),
    (57, "Plate", "head", 35, "AA1"),
    (164, "Rose", "body", 36, "DH1"),
    (165, "Tat", "body", 36, "BF1"),
    (253, "Firebird", "trait", 37, "BR2"),
    (58, "Porcelain", "head", 37, "AA1"),
    (59, "Cream", "head", 38, "HB1"),
    (166, "Tangerine", "body", 38, "BJ1"),
    (254, "Heliotropium", "trait", 39, "MO2"),
    (60, "Baby", "head", 41, "HH1"),
    (61, "Disco", "head", 41, "HB1"),
    (167, "Eyes", "body", 41, "BJ1"),
    (168, "Happymeal", "body", 41, "BJ2"),
    (169, "Maple", "body", 42, "AK1"),
    (170, "Ooze", "body", 43, "BJ1"),
    (62, "Liquid Lavender", "head", 44, "HB2"),
    (171, "Obsidian", "body", 44, "BL1"),
    (172, "Prickles", "body", 44, "AA1"),
    (173, "Prom", "body", 44, "BJ1"),
    (174, "Crystal Camo", "body", 45, "DH1"),
    (63, "Dragonfly", "head", 45, "HB1"),
    (64, "Sahara", "head", 45, "HH1"),
    (65, "Grass", "head", 46, "HB3"),
    (175, "Marble", "body", 46, "BF1"),
    (176, "Rattler", "body", 46, "BF1"),
    (255, "Black Parade", "trait", 49, "CU1"),
    (177, "Forest", "body", 49, "BJ2"),
    (178, "Poker", "body", 49, "BL1"),
    (179, "Black", "body", 50, "BF1"),
    (66, "Ivory", "head", 50, "HB3"),
    (180, "Arctic", "body", 51, "BF1"),
    (181, "Rust", "body", 51, "BJ1"),
    (182, "Smurf", "body", 51, "BJ2"),
    (183, "Dr.", "body", 52, "BF1"),
    (256, "Bonebox", "trait", 53, "GK2"),
    (184, "Aztec", "body", 54, "AK1"),
    (185, "Meat", "body", 54, "FD1"),
    (292, "1960's", "head", 55, "AA2"),
    (257, "Hefner", "trait", 55, "BR1"),
    (186, "Highlights", "body", 55, "EE2"),
    (187, "Leeloo", "body", 55, "BF1"),
    (68, "Royal", "head", 55, "BC1"),
    (69, "Silent Film", "head", 55, "BC4"),
    (70, "Boss", "head", 56, "HH1"),
    (71, "Butane", "head", 57, "HB1"),
    (72, "Coin", "head", 57, "HB3"),
    (188, "Waves", "body", 57, "FD1"),
    (258, "Hammerheat", "trait", 58, "MT1"),
    (259, "Luna", "trait", 58, "AS1"),
    (189, "Plush", "body", 58, "BJ1"),
    (190, "Tickle", "body", 59, "BL1"),
    (191, "Mugged", "body", 60, "BJ1"),
    (192, "Victoria", "body", 60, "BF2"),
    (193, "Cubes", "body", 63, "DM1"),
    (260, "Pop", "trait", 63, "KQ1"),
    (261, "Ring Green", "trait", 63, "DA2"),
    (194, "Sand", "body", 63, "DM1"),
    (262, "Fourzin", "trait", 64, "EH2"),
    (73, "Hacker", "head", 64, "HB2"),
    (195, "Heart", "body", 64, "BI1"),
    (74, "Bumblebee", "head", 65, "BC4"),
    (75, "Camo", "head", 65, "CF1"),
    (76, "Plastik", "head", 65, "HB1"),
    (77, "Mac & Cheese", "head", 67, "AA2"),
    (196, "Carbon", "body", 68, "BJ1"),
    (78, "Crimson", "head", 68, "BC1"),
    (197, "Crystal Clear", "body", 68, "BJ1"),
    (263, "Molten Core", "trait", 68, "HN2"),
    (79, "Dazed Piggy", "head", 69, "HH1"),
    (198, "Sir", "body", 69, "BJ1"),
    (80, "Mahogany", "head", 70, "HB2"),
    (199, "Princess", "body", 70, "BF1"),
    (264, "Bumble Bird", "trait", 72, "BC2"),
    (81, "Big Brother", "head", 73, "HB2"),
    (200, "Chrome", "body", 73, "AK1"),
    (265, "Deep Space", "trait", 73, "FB2"),
    (266, "Night Vision", "trait", 73, "OF2"),
    (82, "Snapshot", "head", 73, "AE1"),
    (83, "Cadillac", "head", 74, "BC2"),
    (84, "Corroded", "head", 74, "AA1"),
    (267, "Albino", "trait", 75, "AJ2"),
    (181, "Rust", "head", 75, "AM1"),  # Duplicate ID 181 - This is head Rust
    (201, "Steam", "body", 76, "BI1"),
    (86, "Business", "head", 77, "AA2"),
    (268, "Scissors", "trait", 77, "AP1"),
    (269, "Black & White", "trait", 78, "JI2"),
    (202, "Goblin", "body", 78, "BI1"),
    (87, "Neon Flamingo", "head", 78, "HB3"),
    (270, "Silver", "trait", 78, "MO1"),
    (184, "Aztec", "head", 79, "HH1"),  # Duplicate ID 184 - This is head Aztec
    (89, "Milk", "head", 80, "AA1"),
    (271, "Whiteout", "trait", 80, "DE2"),
    (90, "Aqua", "head", 81, "HB3"),
    (272, "Lumberjack", "trait", 81, "LG2"),
    (203, "OE Dark", "body", 83, "BF1"),
    (91, "desufnoC", "head", 85, "AK1"),
    (204, "Bone", "body", 86, "DH1"),
    (92, "Bark", "head", 89, "AA1"),
    (205, "Abominable", "body", 90, "BF1"),
    (273, "Chromium", "trait", 91, "CD2"),
    (274, "Rainbow Morpho", "trait", 91, "IL2"),
    (275, "Pawn Shop", "trait", 92, "GK1"),
    (206, "Sky", "body", 93, "BJ1"),
    (207, "Blush", "body", 94, "BJ2"),
    (93, "Polished", "head", 94, "AE1"),
    (94, "Lightning", "head", 96, "AA2"),
    (276, "Ring Blue", "trait", 97, "DA1"),
    (293, "Ol' Faithful", "head", 98, "HB2"),
    (208, "Iron", "body", 99, "BJ1"),
    (209, "James", "body", 99, "BF1"),
    (96, "Classic", "head", 101, "AE1"),
    (210, "Noob", "body", 104, "BJ1"),
    (211, "Matte", "body", 106, "EE1"),
    (277, "Concrete", "trait", 109, "CD1"),
    (278, "Paparazzi", "trait", 111, "OF1"),
    (97, "Shamrock", "head", 113, "HB2"),
    (98, "Exposed", "head", 117, "HB1"),
    (279, "Moth", "trait", 117, "IL1"),
    (280, "Who", "trait", 117, "EH1"),
    (281, "Contractor", "trait", 118, "LG1"),
    (212, "Couch", "body", 118, "BI1"),
    (282, "Stock", "trait", 118, "DE1"),
    (99, "Nuke", "head", 119, "AA2"),
    (283, "101.1 FM", "trait", 121, "BC1"),
    (284, "Technicolor", "trait", 121, "JI1"),
    (100, "Kevlar", "head", 125, "HB2"),
    (285, "Near Space", "trait", 125, "FB1"),
    (101, "Log", "head", 126, "AA2"),
    (213, "Maps", "body", 127, "BJ1"),
    (286, "Vampire", "trait", 129, "AJ1"),
    (214, "Grate", "body", 130, "BF1"),
    (102, "Taser", "head", 132, "AA1"),
    (287, "Pyrex", "trait", 138, "HN1"),
    (288, "Nothing", "trait", 501, "NM1"),
]

# Build matching analysis
def find_matches(variations, body_freq, head_freq, trait_freq):
    results = {
        'high_confidence': [],
        'medium_confidence': [],
        'low_confidence': [],
        'no_match': [],
        'special_numeric': []
    }

    for var_id, name, var_type, count, current_key in variations:
        # Skip special numeric variations
        if current_key.endswith(('H', 'B', 'T')) and current_key[:-1].isdigit():
            results['special_numeric'].append({
                'id': var_id,
                'name': name,
                'type': var_type,
                'count': count,
                'current_key': current_key,
                'action': 'KEEP_UNCHANGED'
            })
            continue

        # Select appropriate frequency map
        if var_type == 'body':
            freq_map = body_freq
        elif var_type == 'head':
            freq_map = head_freq
        else:  # trait
            freq_map = trait_freq

        # Find codes with matching count
        candidates = [(code, freq) for code, freq in freq_map.items() if freq == count]

        # Remove suffix from current key for comparison
        current_clean = current_key.rstrip('HBT')

        if len(candidates) == 1:
            # Perfect match - only one code has this count
            new_code = candidates[0][0]
            confidence = 'HIGH' if new_code != current_clean else 'HIGH_UNCHANGED'
            results['high_confidence'].append({
                'id': var_id,
                'name': name,
                'type': var_type,
                'count': count,
                'current_key': current_key,
                'proposed_key': new_code,
                'confidence': confidence,
                'match_type': 'unique_count_match'
            })
        elif len(candidates) > 1:
            # Multiple codes with same count - ambiguous
            if current_clean in [c[0] for c in candidates]:
                # Current key is one of the candidates
                results['medium_confidence'].append({
                    'id': var_id,
                    'name': name,
                    'type': var_type,
                    'count': count,
                    'current_key': current_key,
                    'candidates': [c[0] for c in candidates],
                    'confidence': 'MEDIUM',
                    'match_type': 'ambiguous_current_valid'
                })
            else:
                # Current key not in candidates
                results['low_confidence'].append({
                    'id': var_id,
                    'name': name,
                    'type': var_type,
                    'count': count,
                    'current_key': current_key,
                    'candidates': [c[0] for c in candidates],
                    'confidence': 'LOW',
                    'match_type': 'ambiguous_current_invalid'
                })
        else:
            # No code found with this count
            results['no_match'].append({
                'id': var_id,
                'name': name,
                'type': var_type,
                'count': count,
                'current_key': current_key,
                'confidence': 'NONE',
                'match_type': 'no_count_match'
            })

    return results

# Run analysis
matches = find_matches(variations, body_freq, head_freq, trait_freq)

# Print comprehensive report
print("=" * 80)
print("COMPLETE VARIATION SOURCE KEY MATCHING ANALYSIS")
print("=" * 80)
print()

print(f"Total variations analyzed: {len(variations)}")
print(f"  - Special numeric variations (unchanged): {len(matches['special_numeric'])}")
print(f"  - High confidence matches: {len(matches['high_confidence'])}")
print(f"  - Medium confidence (ambiguous): {len(matches['medium_confidence'])}")
print(f"  - Low confidence (invalid current): {len(matches['low_confidence'])}")
print(f"  - No matches found: {len(matches['no_match'])}")
print()

print("=" * 80)
print("HIGH CONFIDENCE MATCHES (Unique count match)")
print("=" * 80)
for item in matches['high_confidence']:
    if item['confidence'] == 'HIGH':
        print(f"{item['name']:25} ({item['type']:5}) count={item['count']:3}  "
              f"{item['current_key']:6} -> {item['proposed_key']:6}  [CHANGE]")

print()
print("=" * 80)
print("HIGH CONFIDENCE (No change needed)")
print("=" * 80)
for item in matches['high_confidence']:
    if item['confidence'] == 'HIGH_UNCHANGED':
        print(f"{item['name']:25} ({item['type']:5}) count={item['count']:3}  "
              f"{item['current_key']:6} = {item['proposed_key']:6}  (already correct)")

print()
print("=" * 80)
print("MEDIUM CONFIDENCE (Multiple matches, current key is valid)")
print("=" * 80)
for item in matches['medium_confidence']:
    print(f"{item['name']:25} ({item['type']:5}) count={item['count']:3}  "
          f"current={item['current_key']:6}  candidates={', '.join(item['candidates'])}")

print()
print("=" * 80)
print("LOW CONFIDENCE (Multiple matches, current key NOT in candidates)")
print("=" * 80)
for item in matches['low_confidence']:
    print(f"{item['name']:25} ({item['type']:5}) count={item['count']:3}  "
          f"current={item['current_key']:6}  candidates={', '.join(item['candidates'])} [WARNING]")

print()
print("=" * 80)
print("NO MATCHES FOUND (Count not found in frequency data)")
print("=" * 80)
for item in matches['no_match']:
    print(f"{item['name']:25} ({item['type']:5}) count={item['count']:3}  "
          f"current={item['current_key']:6}  [NO MATCH]")

print()
print("=" * 80)
print("SPECIAL NUMERIC VARIATIONS (Keep unchanged)")
print("=" * 80)
print(f"Total special variations: {len(matches['special_numeric'])}")
print("(These use numeric sourceKeys like 000H, 111B, 999T and should not be changed)")

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
high_changes = sum(1 for item in matches['high_confidence'] if item['confidence'] == 'HIGH')
print(f"High confidence changes to apply: {high_changes}")
print(f"Ambiguous cases requiring review: {len(matches['medium_confidence']) + len(matches['low_confidence'])}")
print(f"Unmatched variations: {len(matches['no_match'])}")
print(f"Special variations (no action): {len(matches['special_numeric'])}")

# Save detailed results to JSON
output = {
    'summary': {
        'total': len(variations),
        'high_confidence_changes': high_changes,
        'high_confidence_unchanged': sum(1 for item in matches['high_confidence'] if item['confidence'] == 'HIGH_UNCHANGED'),
        'medium_confidence': len(matches['medium_confidence']),
        'low_confidence': len(matches['low_confidence']),
        'no_match': len(matches['no_match']),
        'special_numeric': len(matches['special_numeric'])
    },
    'matches': matches
}

with open(r"C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react-staging\source_key_analysis.json", 'w') as f:
    json.dump(output, f, indent=2)

print()
print("Detailed analysis saved to: source_key_analysis.json")
