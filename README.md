# BMX Finish Helper v6.1

Jury-hulpmiddel voor BMX-finishpassages met:

- live camera-preview;
- finishlijn instellen met twee punten;
- live bewegingsdetectie rond de finishlijn;
- recente finishpassages;
- virtuele testpassage met willekeurig nummer;
- experimentele OCR voor nummerherkenning.

## Nieuw in v6.1

De OCR is verbeterd zonder extra OCR-zone-instelling:

- grotere crop rond de gedetecteerde beweging;
- extra crops rond het midden en onder-midden van het beeld;
- beeldvergroting voor OCR;
- contrastverhoging;
- threshold en inverted threshold pogingen;
- alleen cijfers worden geaccepteerd;
- OCR-status toont meer debuginformatie.

Als OCR niets bruikbaars vindt, blijft de passage `Onbekend`.
Als OCR iets mogelijk vindt, toont de app bijvoorbeeld `#501?` met badge `OCR`.
Het vraagteken betekent: onzeker, jury moet controleren.

## Testadvies OCR

Gebruik voor tests:

- grote cijfers;
- dikke zwarte stift;
- wit papier of duidelijk nummerbord;
- zo min mogelijk tegenlicht;
- nummer zo recht mogelijk naar de camera;
- telefoon stil op statief.

OCR blijft experimenteel. De live finishdetectie is leidend; OCR is alleen een hulpmiddel om het nummerlabel te raden.

## Upload naar Vercel

Upload de inhoud van deze map naar GitHub.

Belangrijk:

- upload geen `package-lock.json`;
- laat `.npmrc` staan;
- Vercel build command: `npm run build`;
- output directory: `dist`.
