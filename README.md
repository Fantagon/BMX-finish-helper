# BMX Finish Helper v4 - baanmodus

Deze versie is bedoeld als praktische baanmodus voor testen met een telefoon op statief.

## Wat is nieuw in v4

- De oude testmodusknop is verwijderd.
- Simulatieknoppen zijn uit de normale interface gehaald.
- Camera en recente finishpassages staan tegelijk bovenin beeld.
- Live detectie staat centraal.
- Detectie telt alleen beweging vlak rond de ingestelde finishlijn.
- Gevoeligheid is instelbaar: laag, normaal, hoog.
- Detectiezone is instelbaar: smal, normaal, breed.
- De lijst kan worden gewist met `Lijst wissen`.
- Debug-overlay kan aan of uit.

## Gebruik

1. Open de app via de Vercel HTTPS-link.
2. Geef camera-toestemming.
3. Zet de telefoon stil op een statief.
4. Tik `Finishlijn instellen`.
5. Tik punt A en punt B op de zichtbare finishlijn.
6. Vul voorlopig het rijnummer handmatig in.
7. Laat `Live detectie` aan staan.
8. Laat een rider door de finishlijn rijden.
9. Controleer `Recente finishpassages`.

## Belangrijk

Deze versie doet nog geen echte automatische nummerherkenning. Het ingevulde rijnummer wordt gebruikt als label voor live gedetecteerde finishpassages.

De bewegingsdetectie is eenvoudig. Schaduwen, camerabeweging, publiek, bladeren of andere bewegingen kunnen foutieve meldingen geven. Daarom zijn `Gevoeligheid` en `Detectiezone` toegevoegd.

Aanbevolen startinstellingen:

- Gevoeligheid: normaal
- Detectiezone: normaal

Als er te veel valse meldingen zijn:

- Zet gevoeligheid op laag.
- Zet detectiezone op smal.
- Zorg dat de telefoon volledig stil staat.

Als hij riders mist:

- Zet gevoeligheid op hoog.
- Zet detectiezone op breed.
- Zorg voor beter licht en minder motion blur.

## Geen officiële fotofinish

Omdat de camera schuin van voren staat, kan perspectiefvertekening optreden. Een simpele 2D-lijn in het camerabeeld is een benadering.

Voor betere nauwkeurigheid is later nodig:

- perspectiefcalibratie / homography;
- detectie van het voorwiel of voorste punt van de fiets;
- echte rider-tracking over meerdere frames;
- automatische nummerherkenning;
- hogere framerate;
- goede plaatsing van de telefoon;
- voldoende licht;
- korte sluitertijd / weinig motion blur.

De app helpt de jury met een vermoedelijke volgorde, maar jurycontrole blijft leidend.
