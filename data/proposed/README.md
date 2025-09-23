# AI-Proposed Words Review Workflow

This folder contains AI-generated words that are pending review before being added to the main Librán Dictionary.

## 📁 **Folder Structure**

```
data/proposed/
├── README.md                           # This file
├── ai-proposed-words-<timestamp>.json  # AI-generated words (pending review)
└── ai-proposed-summary-<timestamp>.md  # Human-readable review summary

data/approved/
└── approved-words-<timestamp>.json     # Words approved for integration

data/rejected/
└── rejected-words-<timestamp>.json     # Words rejected with reasons
```

## 🔄 **Review Workflow**

### **1. AI Generation**
When you run the AI-enhanced QA pipeline, new words are automatically saved here:
```bash
node ai-enhanced-qa-pipeline.js --model llama
```

### **2. Review Process**
Use the review tool to manage proposed words:
```bash
# List all proposed files
node review-proposed-words.js list

# Review a specific file
node review-proposed-words.js review ai-proposed-words-2025-09-23T02-43-57-996Z.json

# Approve specific words (by index)
node review-proposed-words.js approve ai-proposed-words-2025-09-23T02-43-57-996Z.json 0,2,5 "Your Name" "Good linguistic quality"

# Reject specific words
node review-proposed-words.js reject ai-proposed-words-2025-09-23T02-43-57-996Z.json 1,3 "Your Name" "Poor etymology"
```

### **3. Integration**
Once words are approved, create an integration batch:
```bash
node review-proposed-words.js batch
```

## 📋 **Review Criteria**

### **Linguistic Accuracy**
- ✅ Ancient form follows Latin patterns
- ✅ Modern form follows Hungarian/Romanian patterns  
- ✅ Etymology is complete and accurate
- ✅ Donor language citations are correct

### **Cultural Fit**
- ✅ Word fits Librán worldbuilding
- ✅ Semantic group is appropriate
- ✅ Maintains cultural authenticity
- ✅ Consistent with established patterns

### **Phonetic Validation**
- ✅ Pronunciation is feasible
- ✅ Phonetic consistency maintained
- ✅ Sound shifts are correct
- ✅ No problematic combinations

### **Documentation Quality**
- ✅ Etymology is complete
- ✅ Reasoning is sound
- ✅ Notes are comprehensive
- ✅ AI reasoning is valid

## 📊 **File Formats**

### **Proposed Words File**
```json
{
  "metadata": {
    "generated_on": "2025-09-23T02:43:57.996Z",
    "ai_model": "llama2:7b-chat",
    "total_proposed": 32,
    "status": "pending_review"
  },
  "proposed_words": [
    {
      "english": "wisdom",
      "ancient": "Sapientia",
      "modern": "bölcsesség",
      "notes": "Lat sapientia; Hu bölcsesség; deep understanding",
      "semantic_group": "core_concepts",
      "ai_reasoning": "Latin 'sapientia' for ancient wisdom, Hungarian 'bölcsesség' for modern form",
      "status": "pending_review",
      "review_notes": "",
      "approved": false,
      "reviewer": "",
      "review_date": null
    }
  ]
}
```

### **Review Summary File**
Each proposed words file has a corresponding markdown summary for easy review, including:
- Word details and AI reasoning
- Review instructions
- Approval/rejection process
- Integration steps

## 🎯 **Best Practices**

### **Review Process**
1. **Read the summary first** - Check the markdown file for overview
2. **Review by semantic group** - Focus on one category at a time
3. **Check linguistic patterns** - Verify donor language usage
4. **Test pronunciation** - Ensure words are speakable
5. **Consider cultural fit** - Does it belong in Librán world?

### **Approval Guidelines**
- ✅ **Approve** words that meet all criteria
- ❌ **Reject** words with poor etymology or cultural mismatch
- 📝 **Add notes** explaining your decision
- 🔄 **Batch process** similar words together

### **Integration Process**
1. Review approved words batch
2. Test in translation system
3. Validate pronunciation
4. Integrate into main dictionary
5. Update version number

## 📈 **Statistics**

Track your review progress:
```bash
node review-proposed-words.js stats
```

This shows:
- Total proposed words
- Pending review count
- Approval/rejection rates
- Review efficiency metrics

## 🚀 **Quick Commands**

```bash
# Generate new words
node ai-enhanced-qa-pipeline.js --model llama

# Review latest batch
node review-proposed-words.js list
node review-proposed-words.js review <latest-file>

# Approve good words
node review-proposed-words.js approve <file> <indices> "Your Name" "Good quality"

# Create integration batch
node review-proposed-words.js batch

# Check statistics
node review-proposed-words.js stats
```

## 📞 **Support**

### **Common Issues**
- **File not found** - Check filename spelling and location
- **Invalid indices** - Use 0-based indexing (0, 1, 2, etc.)
- **Permission errors** - Ensure write access to data folder

### **Getting Help**
- Check file formats above
- Review criteria guidelines
- Use `--help` for command syntax
- Test with small batches first

---

*This workflow ensures AI-generated words are properly reviewed before integration, maintaining the high quality of your Librán Dictionary.*
