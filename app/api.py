from SPARQLWrapper import SPARQLWrapper, JSON
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def cleanup_uri_1(txt: str) -> str:
    return txt.replace('http://scholkg.kmi.open.ac.uk/cskg/resource/', 'cskg:') \
        .replace('http://scholkg.kmi.open.ac.uk/cskg/ontology#', 'cskg-ont:') \
        .replace('http://www.w3.org/2004/02/skos/core#', 'skos:')


def cleanup_uri_2(txt: str) -> str:
    return txt.replace('http://scholkg.kmi.open.ac.uk/cskg/resource/', '') \
        .replace('http://scholkg.kmi.open.ac.uk/cskg/ontology#', '') \
        .replace('http://www.w3.org/2004/02/skos/core#', '')


def cleanup_item(i: dict) -> dict:
    i2 = {
        's': cleanup_uri_2(i['s']['value']),
        'p': cleanup_uri_2(i['p']['value']),
        'o': cleanup_uri_2(i['o']['value'])
    }

    return i2


def is_ok(i: dict) -> bool:
    p = i['p']['value']

    if p.endswith('By'):
        return False
    elif p == 'cskg-ont:methodBases':
        return False
    elif p == 'skos:narrower':
        return False
    else:
        return True


def get_statements(doi: str) -> dict:
    sparql = SPARQLWrapper('https://scholkg.kmi.open.ac.uk/sparqlendpoint/')
    sparql.setReturnFormat(JSON)

    sparql.setQuery(f"""
        PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
        PREFIX cskg: <http://scholkg.kmi.open.ac.uk/cskg/resource/> # CS-KG resources 
        PREFIX cskg-ont: <http://scholkg.kmi.open.ac.uk/cskg/ontology#> # CS-KG ontology 
        PREFIX provo: <http://www.w3.org/ns/prov#> 
        PREFIX cso: <http://cso.kmi.open.ac.uk/schema/cso#> 

        SELECT ?s ?p ?o
        FROM <http://scholkg.kmi.open.ac.uk/cskg> 
        WHERE {{
          ?paper a cskg-ont:MagPaper ;
              cskg-ont:hasDOI "{doi}" .
          ?st provo:wasDerivedFrom ?paper ;
              rdf:subject ?s  ;
              rdf:predicate ?p ;
              rdf:object ?o .
        }}
        """)

    ret = sparql.queryAndConvert()

    papers_statements = [cleanup_item(i) for i in ret['results']['bindings'] if is_ok(i)]

    return {
        'data': papers_statements
    }


def get_random_doi() -> str:
    sparql = SPARQLWrapper('https://scholkg.kmi.open.ac.uk/sparqlendpoint/')
    sparql.setReturnFormat(JSON)

    sparql.setQuery(f"""
        PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
        PREFIX cskg: <http://scholkg.kmi.open.ac.uk/cskg/resource/>
        PREFIX cskg-ont: <http://scholkg.kmi.open.ac.uk/cskg/ontology#>
        PREFIX provo: <http://www.w3.org/ns/prov#> 
        PREFIX cso: <http://cso.kmi.open.ac.uk/schema/cso#> 
         
        SELECT ?doi
        FROM <http://scholkg.kmi.open.ac.uk/cskg> 
        WHERE {{
            ?s a cskg-ont:MagPaper ;
             cskg-ont:hasDOI ?doi .
          FILTER ( 1>  <SHORT_OR_LONG::bif:rnd>  (10000, ?s, ?p, ?o))
        }}
        LIMIT 1
        """)

    ret = sparql.queryAndConvert()

    doi = ret['results']['bindings'][0]['doi']['value']

    return {
        'data': doi
    }


app = FastAPI()

origins = [
    "http://localhost:3000",
    "localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/api/statements/by-doi/{doi:path}", tags=["root"])
async def read_root(doi) -> dict:
    full_doi = f'https://doi.org/{doi}'
    res = get_statements(full_doi)
    return res


@app.get("/api/dois/random", tags=["root"])
async def read_root() -> dict:
    res = get_random_doi()
    return res
