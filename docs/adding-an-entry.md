# Add one catalogue entry

1. Open an issue with a real use case, the artefact someone will take away and one observable pass condition. Choose Components, Pages, Utilities, Modules or AI tools.
2. Give the entry a stable lowercase slug. Add its English title, summary, category and requirements to `app/Catalogue/EntryCatalogue.php`. The registry generates the public link. Keep the slug stable when the title changes.
3. Put standalone files in `kit/<category>/<slug>/` when appropriate. A copyable UI component can live with the application if its source and complete dependencies are available on the entry page. Use fabricated examples.
4. Connect the slug to its recipe from `resources/js/pages/Entry.tsx` or the grouped recipe renderer. Include a working preview, requirements, setup, source and a check the visitor can perform. Import displayed source with Vite's `?raw` when the executable file is available. Keep private data and credentials outside source examples.
5. Translate the entry metadata in `resources/js/i18n.tsx` and its surrounding interface in the recipe. Keep program text in its original language and direction. Verify direct load, keyboard navigation, German wrapping and Arabic reading order on a narrow screen.
6. Update the expected inventory in the catalogue tests. Exercise actual success and failure paths. Include the commands and results in the pull request, along with the issue number.

A new category changes the Browse filters, accepted metadata category, labels and tests together. A new entry in an existing category uses the existing routes and publishing workflow.
