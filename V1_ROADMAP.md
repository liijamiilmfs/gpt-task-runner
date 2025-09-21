# Librán Voice Forge v1.0.0 Roadmap

## 🎯 **Release Goal**
A stable, production-ready English-to-Librán translation and TTS system with robust error handling, caching, and user experience.

## 📋 **Core Features for v1.0.0**

### ✅ **COMPLETED**
- [x] **CI — lint/typecheck gates as required status checks** (Issue #31)
  - Exposed lint and type-check as separate named CI jobs
  - Can be marked as required in branch protection rules

### 🚀 **HIGH PRIORITY (Must Have for v1.0.0)**

#### **Core Translation & TTS**
1. **Integration — unknown token logger & patch loop** (Issue #21)
   - Collect [unknown] tokens during translation
   - Write to `/build/UNKNOWN_TOKENS.csv` to aid lexicon growth
   - **Impact**: Essential for improving translation accuracy

2. **TTS caching — content hash → audio file reuse** (Issue #23)
   - Hash Librán text + voice + format
   - Reuse audio if cache hit; store in `/outputs/audio`
   - **Impact**: Performance and cost optimization

3. **Integration — budget guardrails & rate limiting** (Issue #22)
   - Implement DAILY/MONTHLY caps
   - MAX_CHARS_PER_TTS limits
   - Allowed-model allowlist
   - 429 retry with backoff
   - **Impact**: Cost control and API stability

#### **User Experience**
4. **UI — clipboard copy & filename template** (Issue #25)
   - Add copy buttons for Librán text
   - Filename template: `{variant}-{hash}-{ts}.mp3`
   - **Impact**: Better user workflow

5. **Error taxonomy & user-facing messages** (Issue #24)
   - Normalize API errors
   - Map to friendly UI strings
   - Add server logs with correlation ids
   - **Impact**: Professional error handling

### 🔧 **MEDIUM PRIORITY (Should Have for v1.0.0)**

6. **UI — voice preview & quick A/B test** (Issue #26)
   - Short sample per voice
   - Toggle voices
   - Persist last used settings
   - **Impact**: Better voice selection UX

7. **Integration — hot-reload dictionaries without redeploy** (Issue #20)
   - Watch dict files
   - Reload in-memory maps on change
   - Expose `/api/admin/reload` (protected in dev)
   - **Impact**: Development efficiency

8. **Testing - Improve Python integration tests** (Issue #43)
   - Refine integration tests for dictionary importer
   - Core parsing functionality already works
   - **Impact**: Test reliability

### 📚 **NICE TO HAVE (Can Defer to v1.1.0)**

9. **UI — accessibility pass** (Issue #27)
   - Focus order, labels, aria-live for audio ready
   - Keyboard shortcuts
   - **Impact**: Accessibility compliance

10. **Importer 3(B).7 — maintain exclude_terms.txt + policy** (Issue #16)
    - Ship `data/exclude_terms.txt`
    - Filter divine/pantheon/Comoară terms
    - **Impact**: Dictionary quality (can use existing JSON parsing)

## 🎯 **v1.0.0 Success Criteria**

- [ ] **Core Functionality**: English → Librán → Audio pipeline works reliably
- [ ] **Performance**: TTS caching reduces API calls by 80%+
- [ ] **Cost Control**: Budget guardrails prevent runaway costs
- [ ] **User Experience**: Copy/paste workflow, clear error messages
- [ ] **Monitoring**: Unknown token logging for continuous improvement
- [ ] **Stability**: All tests passing, CI pipeline green
- [ ] **Documentation**: Clear setup and usage instructions

## 🚀 **Implementation Strategy**

### **Phase 1: Core Infrastructure (Week 1)**
1. Unknown token logger & patch loop
2. TTS caching system
3. Budget guardrails & rate limiting

### **Phase 2: User Experience (Week 2)**
4. Error taxonomy & user-facing messages
5. UI clipboard copy & filename template
6. Voice preview & A/B testing

### **Phase 3: Polish & Testing (Week 3)**
7. Hot-reload dictionaries
8. Improve Python integration tests
9. Final testing and documentation

## 📊 **Current Status**
- **Total Issues**: 14 open issues
- **High Priority**: 5 issues
- **Medium Priority**: 3 issues
- **Nice to Have**: 2 issues
- **Completed**: 1 issue

## 🔄 **Next Steps**
1. Start with **Issue #21** (unknown token logger) - foundational for improvement
2. Implement **Issue #23** (TTS caching) - immediate performance benefit
3. Add **Issue #22** (budget guardrails) - essential for production
4. Continue with UI improvements and error handling

---

*This roadmap focuses on delivering a solid v1.0.0 that users can rely on, with clear paths for future enhancements.*
