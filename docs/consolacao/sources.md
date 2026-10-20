# Sources for the 3D model

Every picture or document the model is checked against. Downloaded copies live in `docs/consolacao/refs/`. That folder is gitignored, because most of the pictures are third-party copyright. This list is the committed record.

## Photos

| Source | What it shows | Licence | Used for |
|---|---|---|---|
| [Wikimedia Commons: Prédio do Instituto Sedes Sapientiae](https://commons.wikimedia.org/wiki/Category:Pr%C3%A9dio_do_Instituto_Sedes_Sapientiae), 15 photos, 2016-09-27 (Ana Júlia Cano, Projeto Commons Cásper Líbero) | Patio façades, cobogó, wavy canopies, Auditório roof terrace, Prédio 1 interior (2nd and 3rd floor), street front | CC BY-SA 4.0 | Today: Prédio 1 still has parquet floors and grid windows at the corridor ends; cream walls and white louvred shutters; terrace lawn with railing |
| PUC-SP course-page galleries (`/sites/default/files/galeria/consolacao1–6.jpg`, `1_8…11_8.jpg`) | Patio, canopies (red column bands), glazed corridor today, computer lab (parquet, butcher-block tables), chapel, workshops | PUC-SP (reference only) | Today's corridor furniture, column bands, path curb, chapel and lab references |
| `docs/consolacao/pictures/videoplayback.mp4`, drone and walk-through video (60 s, "PUC SP Marquês de Paranaguá") | Roofs from above, patio garden, canopies, court, Prédio 3 | Unknown (reference only) | Canopy tops are dark waterproofing over white soffits on white columns; lobed hedge beds and flagstone path in the patio; Prédio 3 is a white block with a dark flat roof |
| `docs/consolacao/pictures/Screenshot …` (Google Maps photos and Street View) | Glazed corridor, classrooms, study room, court, gate, aerial view | Google / uploaders (reference only) | Today's finishes: terracotta corridor tile, tactile strip, globe pendants; black tablet-arm chairs; white tables and black chairs |
| [Arquigrafia: Instituto "Sedes Sapientiae"](https://arquigrafia.org.br/explore/acervo/mosaic?q=Sedes+Sapientiae), 11 slides, 1998 (Leandro Lopes Pereira de Melo; Acervo da Biblioteca da FAUUSP) | Aerials of Prédio 1's terracotta hip roof and the Auditório's planted roof terrace and grey hip roof; the wavy canopy on round columns; Prédio 2's glazed corridor (red tile, cobogó glazing) | CC BY-NC-SA 4.0 | Roof terrace side, canopy columns, corridor finish; copies in `refs/arquigrafia/` |
| Google Maps place photo, May 2018 (user upload) | The patio garden in front of Prédio 2's cobogó façade | Uploader's (reference only) | Patio planting; copy in `refs/google-maps/` |
| `public/history/1943-*.jpg` (Acrópole nº 64, 1943) | The institute in 1943: dorm room, reading room, restaurant, lab, auditorium, halls | Published 1943; see `data/history.json` | The 1943 view: parquet, dark wood furniture, white tablecloths, raked auditorium |

## Measurements

| Source | What it gives | Licence | Used for |
|---|---|---|---|
| [PMSP LiDAR 2017](https://registry.opendata.aws/pmsp-lidar/) (Prefeitura de São Paulo, AWS Open Data, Entwine Point Tiles `ept-m3dc-pmsp`) | Classified point cloud (~10 pts/m², ~10 cm accuracy, May–July 2017) | Open data (registry lists GPL-3.0 for the tooling) | Eave and ridge heights of every campus building; two unmapped buildings; neighbour heights; terrain. Pulled with `scripts/lidar-campus.py` |
| Esri World Imagery tiles, zoom 19 | Satellite view of the lot | Esri terms (reference only, not redistributed) | Roof colours and shapes; confirms the LiDAR buildings |

## Documents

| Source | Facts used |
|---|---|
| [PUC-SP Biblioteca, Campus Consolação](https://pucsp.br/biblioteca/campus-consolacao) | The BFCET library (founded 1971) is in Prédio 2's basement |
| [PUC Tour, Campus Consolação](https://www5.pucsp.br/puc-tour/consolacao.php) | The auditorium is today the Auditório Joel Martins; the canopies' folds stiffen the slab (wartime steel shortage); eaves double as gutters; an "Irmãs Agostinianas" house is on the site |
| [FUNDASP Radar: nove salas reformadas](https://fundasp.org.br/radar/marques-de-paranagua-campus-inicia-ano-letivo-com-nove-salas-de-aula-reformadas/) (Feb 2026, 4 photos) | Today's classrooms: revitalised parquet, blue tablet-arm chairs, suspended black lighting/AC racks |
| [FUNDASP Radar: climatizar 10 espaços](https://fundasp.org.br/radar/fundasp-vai-climatizar-10-espacos-no-campus-marques-de-paranagua/) | Prédio 3: basement lab and three classrooms on each of floors 1–3 |
| [FUNDASP Radar: restauro de piano](https://fundasp.org.br/radar/fundasp-apoia-restauro-de-piano-historico-do-campus-marques-de-paranagua/) and [J.PUC-SP: capela inaugurada](https://j.pucsp.br/noticia/pastoral-universitaria-inaugura-capela-no-campus-marques-de-paranagua) | Capela Nossa Senhora "Sedes Sapientiae", opened 22 Sep 2023, with the canonesses' 1971 piano and a panel by Dom Marcelo Molinero; its room is not stated |
| [PUC-SP campi page](https://www.pucsp.br/universidade/universidade-campi-e-unidades-suplementares) | Address and hours only |
| [ArchDaily: Em foco, Rino Levi](https://www.archdaily.com/pt/779671/em-foco-rino-levi) | Three Rino Levi buildings (1940–42) and Burle Marx gardens; Prédio 3 and the DTI are therefore later additions (`later: true`) |
| `docs/consolacao/floor-plans/` | Rino Levi's 1942 plans, the CONDEPHAAT and CONPRESP listings, GeoSampa lot data |

## Not used

- Instagram, Facebook and other login-walled networks: they can't be scraped within their terms, and most of their photos are private people's posts.

