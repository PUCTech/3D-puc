# Floor plan sources (for v2 indoor data)

Research notes, 2026-10-10. Campus: PUC-SP Consolação, R. Marquês de Paranaguá 111.

## Key fact

The campus is the former **Instituto Sedes Sapientiae**, designed by **Rino Levi** (1940–1942): built around an inner courtyard with undulating marquees and his first roof garden. It is reported as heritage-listed by **CONDEPHAAT** (state). Because it's a well-known modernist work, its plans exist in archives and academic literature.

## Sources, best first

1. **PUC-SP facilities / Prefeitura do Campus.** Current plans (CAD/PDF) including later renovations. Ask officially as PUC Tech (league letterhead, purpose: wayfinding + event map). Most accurate and current. Contact: (11) 3124-7200 / pucsp.br/universidade/contato.
2. **FAU-USP Library — Coleção Rino Levi.** Holds Rino Levi's original office drawings (the FAU-USP projects archive has ~400k sheets from 40+ offices; its catalog is online). Search the catalog for "Sedes Sapientiae", then request consultation or scans. Original 1942 plans: the layout will be right but may predate renovations.
   - https://repositorio.usp.br/item/003002136
   - https://www.indicedearquitetura.fau.usp.br/item/42799
3. **CONDEPHAAT tombamento process.** Heritage-listing dossiers usually include survey plans of the building. Request via the state's SIC (Lei de Acesso à Informação), citing the Sedes Sapientiae listing.
4. **Academic papers and theses on Rino Levi.** Often reproduce ground-floor plans (enough for room blocks):
   - USP thesis repository: https://www.teses.usp.br/teses/disponiveis/16/16131/tde-21102022-104514/
   - Docomomo Brasil paper: https://docomomobrasil.com/wp-content/uploads/2016/01/098.pdf
   - ACSA 2021 paper: https://acsa-arch.org/proceedings/International%20Proceedings/ACSA.Intl.2021/ACSA.Intl.2021.55.pdf
   - Book: *Rino Levi* (Anelli, Guerra, Kon — Edições Sesc/Romano Guerra), widely held in libraries.
5. **Evacuation plans on each floor.** Fire-safety rules require them to be posted on every floor. Photographing them gives current room numbers and layout.
6. **City permit plans (SEL / e-SIC).** Approved permit plans can be requested via http://esic.prefeitura.sp.gov.br. Plans of private property may be refused or redacted. This is the lowest-yield option.
7. **On-site survey.** A walk with a laser measure or the phone's LiDAR (iPhone Pro "RoomPlan" apps export floor plans). Good for filling gaps.

## Exterior data (already confirmed)

- **OpenStreetMap:** campus boundary is way 38629633. It contains 16 building footprints, all tagged with `height` (3–16 m) and none named. These feed `scripts/import-footprints.ts`.
- **GeoSampa:** 2017 and 2020 LiDAR point clouds (MDS/MDT, LAZ, about 10 cm). Use these if the OSM heights look wrong.
