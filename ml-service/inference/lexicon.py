LEXICON = {
    "hate": {
        "hate": 0.8,
        "nafrat": 0.62,
        "नफरत": 0.7,
        "racist": 0.75,
        "terrorist": 0.6,
        "inferior": 0.5,
        "filthy": 0.55,
        "जात": 0.45,
        "jaat": 0.45,
    },
    "toxicity": {
        "useless": 0.5,
        "worthless": 0.65,
        "idiot": 0.6,
        "stupid": 0.5,
        "bewakoof": 0.58,
        "बेवकूफ": 0.62,
        "murkh": 0.5,
        "मूर्ख": 0.55,
        "trash": 0.55,
        "garbage": 0.6,
        "shut": 0.25,
        "pagal": 0.45,
        "पागल": 0.48,
        "bekar": 0.5,
        "बेकार": 0.5,
        "nikamma": 0.62,
        "निकम्मा": 0.62,
        "ghatiya": 0.58,
        "घटिया": 0.58,
        "ganda": 0.45,
        "गंदा": 0.45,
    },
    "offensive": {
        "moron": 0.55,
        "loser": 0.5,
        "dumb": 0.45,
        "fool": 0.35,
        "saale": 0.55,
        "साले": 0.55,
        "kutta": 0.6,
        "कुत्ता": 0.6,
    },
    "threat": {
        "kill": 0.95,
        "hurt": 0.72,
        "attack": 0.7,
        "destroy": 0.62,
        "die": 0.72,
        "mar": 0.58,
        "maar": 0.8,
        "मार": 0.8,
        "मारूंगा": 0.82,
        "मारूंगी": 0.82,
    },
    "cyberbullying": {
        "expose": 0.55,
        "humiliate": 0.65,
        "mock": 0.38,
        "bully": 0.7,
        "harass": 0.75,
    },
}


def flattened_terms():
    terms = {}
    for category, words in LEXICON.items():
        for word, score in words.items():
            terms[word] = max(terms.get(word, 0), score)
    return terms
