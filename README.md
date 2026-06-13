# BMX Finish Helper — v5 baanmodus

BMX Finish Helper is een jury-hulpmiddel voor BMX-finishpassages.

Deze versie bevat:

- live camerabeeld;
- finishlijn instellen met twee punten;
- opslag van de finishlijn in localStorage;
- automatische eenvoudige bewegingsdetectie rond de finishlijn;
- recente finishpassages in beeld naast/onder de camera;
- instelbare gevoeligheid;
- instelbare detectiezone;
- debug-overlay voor detectiepunten en bewegingsboxen.

## Belangrijke wijziging in v5

Het rijnummer-veld is verwijderd uit de hoofdinterface.

De app doet in deze versie nog geen betrouwbare automatische nummerherkenning. Daarom worden live gedetecteerde finishpassages getoond als:

```txt
Onbekend
```

Dit is bewuster en minder verwarrend dan een handmatig rijnummer in de hoofdinterface.

## OCR / nummerherkenning

Automatische OCR is mogelijk, maar moet als experimentele functie worden toegevoegd en getest. Bij BMX is OCR lastig door:

- hoge snelheid;
- motion blur;
- schuin camerabeeld;
- klein nummerbord;
- overlap door stuur/handen/voorwiel;
- wisselende lichtomstandigheden;
- lage browsercameraresolutie;
- telefoons die beperkt rekenvermogen hebben tijdens live video.

De aanbevolen vervolgstap is een aparte experimentele OCR-modus die alleen een crop rond de rider/finishzone analyseert en de uitslag pas toont als onzeker of voorlopig.

## Gebruik

1. Open de app via HTTPS.
2. Geef camera-toestemming.
3. Tik op **Finishlijn instellen**.
4. Tik punt A en punt B op de zichtbare finishlijn.
5. Zet **Live detectie** aan.
6. Laat een rider door beeld over de finishlijn rijden.
7. Controleer **Recente finishpassages**.

## Beperkingen

Deze app is geen officiële fotofinish. Door schuine camera-opstelling en perspectiefvertekening is de detectie een benadering. Jurycontrole blijft leidend.

Voor betere nauwkeurigheid zijn later nodig:

- perspectiefkalibratie / homography;
- voorwiel- of voorste-puntdetectie;
- robuustere tracking;
- hogere framerate;
- goede plaatsing van de telefoon;
- voldoende licht;
- korte sluitertijd / weinig motion blur;
- betrouwbare OCR of een ander nummerherkenningsmechanisme.
