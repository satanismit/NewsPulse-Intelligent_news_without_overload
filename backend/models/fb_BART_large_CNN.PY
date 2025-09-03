from transformers import pipeline

# Load summarization pipeline with BART
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Example news article (replace with your uploaded text)
article = """
India successfully launched its first solar observation mission, Aditya-L1, 
from the Sriharikota space center on Saturday. The spacecraft will study the Sun 
from a halo orbit around the Lagrange point 1, about 1.5 million km from Earth. 
This will help scientists better understand solar activities and their impact 
on space weather, which can affect satellites, communication systems, and power grids on Earth.
"""

print("Genrating summary")

# Generate summary
summary = summarizer(article, max_length=100, min_length=30, do_sample=False)

print("Summary:", summary[0]['summary_text'])
