---
title: "Machine Learning Classifications for Botanical Collections"
layout: experience_entry
start_date: June 2019
end_date: August 2019
org: The Field Museum in Chicago, IL
---

<h3>Summary</h3>
<p>In this 10 week internship, my main project was implementing a <span class="standOut">convolutional neural network</span> to distinguish between herbarium images of two morphologically similar genera of ferns: Lycopodium and Selaginella. I worked under Dr. Matt von Konrat, the Head of Botanical Collections, who specializes in the study of bryophytes (early land plants). Prior to this internship, I had no experience with machine learning and had to pick up a lot of it on the spot during the project. This project is based off of a <a href="https://bdj.pensoft.net/article/21139/element/5/3811021/">Smithsonian paper</a> that created a model very similar to this and obtained over 95% accuracy.</p>
<p>The first steps were to attempt to recreate this model. However, this isn't as easy as it sounds for a few reasons. First, the Smithsonian model was created in Mathematica, which we did not have the resources for. I used Keras and Tensorflow in Python and the features in the Mathematica models didn't always exist directly in Keras. For example, in Mathematica, regularization is applied directly to the whole model, while with Keras, we had to specify one of three types of regularizers and choose which layers to apply them to. Additionally, the images we used were different since we used images from the Field Museum online herbarium. During my time, I didn't have access to a particularly robust computer and since my machine was i5 and 8GB RAM, that limited the quality and number of images I could load into the model at once.</p>
<p>Additionally, a topic that Dr. Matt von Konrat is researching is a new species of frullania, a microplant whose details can only be seen with a microscope. He has discovered a new species that was classified with another species in the past; as further evidence that these are different, we want to apply the machine learning model into images of these two microplant species (frullania coastal and frullania rostrata). If the machine can successfully learn and pick up the differences between the two, that is further evidence for his case of speciation.</p>
<p>At the end of my 10 weeks, we were able to reach an average of around 88% accuracy for the Smithsonian "replication" and 70% accuracy for the frullania. The project is currently being continued by Beth McDonald, a computer science Master's student at Northeastern Illinois University, who is mentored by computer science professor Dr. Francisco Iacobelli. </p>
<h3>Main Takeaways</h3>
<p>From this internship, I first learned a lot of the technicalities of machine learning and implementing my own model. This exposure made me curious, however, in discovering how to know what layers in what order with what parameters will make a successful model? There must be a better way than trial/error and I'd love to explore that! I also learned that machine learning is essentially large scale math, and this project made me curious about that aspect a little more. Additionally, I learned a lot about myself. <span class="standOut">I learned about my work habits and <i>how</i> I learn on my own</span>. I didn't have much guidance from an expert and had to utilize various websites and blog posts, adapting the information to my own project. Lastly, this experience solidified for me that I would love a role in a <span class="standOut">cross disciplinary field</span>, applying computer science into a new industry or field! It's really exciting to see applications of something I love benefit others and it motivates me knowing the greater impact my work is having. </p>
<hr>

<h3>Additional Links:</h3>
<ul>
	<li><a href="https://github.com/allisonchen23/ml_classifications">My Github Repository</a></li>
	<li><a href="https://github.com/emcdona1/field_classification">Continuing Project Github Repository</a></li>
	<li><a href="https://docs.google.com/spreadsheets/d/15972K_rdv3zpnvnV--wSaTpiK0jnVDkBzhUWjre5BLg/edit?usp=sharing">Documentation of all updates and effects</a></li>
	<li><a href="https://allisonchen23.github.io/food_for_thought/field_museum_blog/index.html">My blog posts from this summer</a></li>
</ul>
<hr>

<h3>Photo Gallery</h3>
<div id="photo_gal">
	<div class="pic_and_cap">
		<div class="pic"><img src="../assets/images/experience/fm/field_n_entrance.jpg" alt="view of museum from north" class="images full">
		</div>
		<div class="cap"><p class="caption">Where I got to work every day!</p>
		</div>
	</div>
	<div class="pic_and_cap">
		<div class="pic"><img src="../assets/images/experience/fm/chinatown.jpg" alt="group lunch to chinatown!" class="images full">
		</div>
		<div class="cap"><p class="caption">Group lunch out to Chinatown!</p>
		</div>
	</div>
	<div class="pic_and_cap">
		<div class="pic"><img src="../assets/images/experience/fm/hero_coffee.jpg" alt="fav coffee shop in Chicago" class="images full">
		</div>
		<div class="cap"><p class="caption">I don't drink coffee, but I love passing by Hero Coffee</p>
		</div>
	</div>
	<div class="pic_and_cap">
		<div class="pic"><img src="../assets/images/experience/fm/kamila_suey_yee.jpg" alt="new friends" class="images full">
		</div>
		<div class="cap"><p class="caption">Kamila (L) and Suey Yee (R) are new friends from Malaysia!</p>
		</div>
	</div>
	<div class="pic_and_cap">
		<div class="pic"><img src="../assets/images/experience/fm/crew.jpg" alt="part of the crew" class="images full">
		</div>
		<div class="cap"><p class="caption">Part of our crew at the end of the summer!</p>
		</div>
	</div>
</div>