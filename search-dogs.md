---
layout: search
title: search dogs
---

Demo!
-----

Have a breed of dog in mind? Shelters usually can't attest to the genetics or lineage of a pet, but they can describe the characteristics they observe. If you have a breed in mind, you can [start your search with those breed's features](javascript: display_breed_filler(); false;), to get pets that are closest what you want.


pick traits
-----------

<form id="search" onchange="change(this);" action="javascript: false;">
<fieldset id="shapesfields"><legend>shape</legend></fieldset>
<fieldset id="colorsfields"><legend>colors</legend></fieldset>
<fieldset id="goodwithfields"><legend title="Stewards at shelters can not judge this very well, so it doesn't have a strong weight in searching.">known good with&#x2a;</legend><label><input type="checkbox" id="goodwithkids">&#x1f476;&#x1f6bc;</label><label><input type="checkbox" id="goodwithdogs">&#x1f436;&#x1f415;</label><label><input type="checkbox" id="goodwithcats">&#x1f431;&#x1f408;</label></fieldset>
<fieldset id="weightfield"><legend>adult weight</legend></fieldset>
<fieldset id="energyfield"><legend>energy level</legend><input id="energy" type="range" min="0" max="1" step="0.1"></fieldset>
<fieldset><legend>sex</legend><label><input id="sexf" type="checkbox" checked>female</label> <label><input id="sexm" type="checkbox" checked>male</label></fieldset>
</form>



best matches
------------

<ol id="petlist"></ol>

<script src="js/search-dogs.js"></script>
