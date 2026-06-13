# BMX Finish Helper v6

Een mobiele webapp als jury-hulpmiddel voor BMX-finishpassages.

## Wat werkt

- Camera-preview via browsercamera.
- Finishlijn instellen met twee punten.
- Finishlijn wordt opgeslagen in `localStorage`.
- Live bewegingsdetectie rond de finishlijn.
- Recente finishpassages blijven ongeveer 15 seconden zichtbaar.
- Virtuele testpassage met willekeurig nummer.
- Experimentele OCR om na een finishpassage een nummer te proberen lezen.

## Belangrijk over OCR

OCR is in deze versie experimenteel. De app probeert na een gedetecteerde finishpassage een crop rond de bewegingsbox te lezen met Tesseract.js.

Bij BMX is dit moeilijk door:

- beweging;
- kleine nummerbordjes;
- schuine camera;
- motion blur;
- wisselend licht;
- deels verborgen nummerborden.

Daarom geldt:

- als OCR niets bruikbaars vindt, blijft de passage `Onbekend`;
- als OCR iets denkt te zien, toont de app bijvoorbeeld `#323?` met badge `OCR`;
- het vraagteken betekent: controle door jury blijft nodig.

## Adviesinstellingen

Start met:

- Live detectie: aan
- OCR proberen: uit
- Gevoeligheid: normaal
- Detectiezone: normaal
- Debug: aan

Zet OCR pas aan nadat de basisdetectie goed werkt.

## Deploy

Upload de inhoud van deze map naar GitHub en deploy via Vercel.

Let op:

- Upload `package-lock.json` niet.
- Laat `.npmrc` wel staan.
- Vercel build command: `npm run build`
- Output directory: `dist`

## Beperking

Dit is geen officiële fotofinish. De app helpt de jury met een vermoedelijke volgorde en eventueel een onzeker OCR-nummer. Jurycontrole blijft leidend.
