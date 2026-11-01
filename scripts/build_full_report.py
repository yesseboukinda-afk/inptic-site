#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de génération intégrale du Rapport de Stage INPTIC.
Produit un document Word (.docx) hautement qualitatif, complet et professionnel (45-50 pages standard).
Auteur : Yesse Boukinda Mabicka
"""

import os
import sys
from io import BytesIO
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from PIL import Image

def build_full_report():
    doc = Document()
    
    # Configuration des marges de page
    for section in doc.sections:
        section.top_margin = Inches(0.9)
        section.bottom_margin = Inches(0.9)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True
        
        # En-tête (pages > 1)
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("INPTIC GABON — Plateforme Numérique PWA & IA")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139)
        
        # Pied de page (pages > 1)
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        
        frun_left = fp.add_run("Rapport de Stage de Fin de Cycle — Yesse Boukinda Mabicka")
        frun_left.font.name = "Calibri"
        frun_left.font.size = Pt(8.5)
        frun_left.font.color.rgb = RGBColor(100, 116, 139)
        
        fp.paragraph_format.tab_stops.add_tab_stop(Inches(6.5))
        fp.add_run("\t")
        
        frun_right = fp.add_run("Page ")
        frun_right.font.name = "Calibri"
        frun_right.font.size = Pt(8.5)
        frun_right.font.color.rgb = RGBColor(100, 116, 139)
        
        fldSimple = OxmlElement('w:fldSimple')
        fldSimple.set(qn('w:instr'), 'PAGE')
        fp._p.append(fldSimple)
        
        frun_of = fp.add_run(" / ")
        frun_of.font.name = "Calibri"
        frun_of.font.size = Pt(8.5)
        frun_of.font.color.rgb = RGBColor(100, 116, 139)
        
        fldNumpages = OxmlElement('w:fldSimple')
        fldNumpages.set(qn('w:instr'), 'NUMPAGES')
        fp._p.append(fldNumpages)

    # Fonctions utilitaires internes
    def set_cell_background(cell, hex_color):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(22)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(16.5)
        run.bold = True
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(13.5)
        run.bold = True
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.bold = True
        run.font.color.rgb = RGBColor(2, 132, 199)
        return p

    def add_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.bold = True
            r_pre.font.name = "Calibri"
            r_pre.font.size = Pt(11)
            r_pre.font.color.rgb = RGBColor(15, 23, 42)
            
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_bullet(title, desc=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        
        if desc:
            r_t = p.add_run(f"{title} : ")
            r_t.bold = True
            r_t.font.name = "Calibri"
            r_t.font.size = Pt(10.5)
            r_t.font.color.rgb = RGBColor(15, 23, 42)
            
            r_d = p.add_run(desc)
            r_d.font.name = "Calibri"
            r_d.font.size = Pt(10.5)
            r_d.font.color.rgb = RGBColor(51, 65, 85)
        else:
            r_t = p.add_run(title)
            r_t.font.name = "Calibri"
            r_t.font.size = Pt(10.5)
            r_t.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_callout(text, title="REMARQUE TECHNIQUE"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "F0F9FF")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="0284C7"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run_t = p.add_run(f"📌 {title} : ")
        run_t.bold = True
        run_t.font.name = "Calibri"
        run_t.font.size = Pt(10)
        run_t.font.color.rgb = RGBColor(2, 132, 199)
        
        run_body = p.add_run(text)
        run_body.font.name = "Calibri"
        run_body.font.size = Pt(9.5)
        run_body.font.color.rgb = RGBColor(30, 41, 59)
        
        p_post = doc.add_paragraph()
        p_post.paragraph_format.space_before = Pt(0)
        p_post.paragraph_format.space_after = Pt(4)

    def add_table_styled(headers, data, col_widths=None):
        table = doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        hdr_cells = table.rows[0].cells
        for i, title in enumerate(headers):
            hdr_cells[i].text = title
            set_cell_background(hdr_cells[i], "1E293B")
            set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
            p = hdr_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in p.runs:
                run.font.bold = True
                run.font.size = Pt(9.5)
                run.font.name = "Calibri"
                run.font.color.rgb = RGBColor(255, 255, 255)
                
        for r_idx, row_data in enumerate(data):
            row_cells = table.rows[r_idx + 1].cells
            bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                row_cells[c_idx].text = str(val)
                set_cell_background(row_cells[c_idx], bg_col)
                set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
                p = row_cells[c_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.size = Pt(9)
                    run.font.name = "Calibri"
                    run.font.color.rgb = RGBColor(30, 41, 59)
                    
        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = Inches(width)
                    
        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(6)
        return table

    def add_code_snippet(code_str, caption=None):
        if caption:
            cp = doc.add_paragraph()
            cp.paragraph_format.space_before = Pt(6)
            cp.paragraph_format.space_after = Pt(2)
            crun = cp.add_run(f"Code : {caption}")
            crun.font.size = Pt(9)
            crun.font.bold = True
            crun.font.name = "Calibri"
            crun.font.color.rgb = RGBColor(71, 85, 105)
            
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(code_str)
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(226, 232, 240)
        
        p_end = doc.add_paragraph()
        p_end.paragraph_format.space_before = Pt(0)
        p_end.paragraph_format.space_after = Pt(6)

    # =========================================================================
    # 1. PAGE DE GARDE OFFICIELLE
    # =========================================================================
    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_before = Pt(0)
    p_rep.paragraph_format.space_after = Pt(2)
    r = p_rep.add_run("RÉPUBLIQUE GABONAISE\n")
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(15, 23, 42)
    r_dev = p_rep.add_run("Union — Travail — Justice\n—————")
    r_dev.font.size = Pt(9.5)
    r_dev.font.italic = True
    r_dev.font.color.rgb = RGBColor(100, 116, 139)

    p_min = doc.add_paragraph()
    p_min.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_min.paragraph_format.space_before = Pt(4)
    p_min.paragraph_format.space_after = Pt(8)
    r_min = p_min.add_run("MINISTÈRE DE LA COMMUNICATION ET DE L'ÉCONOMIE NUMÉRIQUE\n"
                          "INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION\n"
                          "(INPTIC GABON)")
    r_min.bold = True
    r_min.font.size = Pt(11)
    r_min.font.color.rgb = RGBColor(30, 58, 138)

    # Logo INPTIC
    logo_path = "/home/yesse/Bureau/inptic-site-PWA/public/logoinptic.ico"
    if os.path.exists(logo_path):
        logo = BytesIO()
        with Image.open(logo_path) as source:
            source.convert("RGBA").save(logo, format="PNG")
        logo.seek(0)
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(6)
        p_logo.paragraph_format.space_after = Pt(12)
        doc.add_picture(logo, width=Inches(2.6))
        # recentrer la dernière image
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

    p_doc_type = doc.add_paragraph()
    p_doc_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_doc_type.paragraph_format.space_before = Pt(10)
    p_doc_type.paragraph_format.space_after = Pt(4)
    r_dt = p_doc_type.add_run("RAPPORT DE STAGE DE FIN DE CYCLE")
    r_dt.bold = True
    r_dt.font.size = Pt(13)
    r_dt.font.color.rgb = RGBColor(2, 132, 199)

    p_sub_type = doc.add_paragraph()
    p_sub_type.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub_type.paragraph_format.space_before = Pt(0)
    p_sub_type.paragraph_format.space_after = Pt(14)
    r_st = p_sub_type.add_run("En vue de l'obtention du diplôme d'ingénieur / Licence Professionnelle en Informatique")
    r_st.font.italic = True
    r_st.font.size = Pt(10)
    r_st.font.color.rgb = RGBColor(100, 116, 139)

    # Titre du Projet dans un cadre élégant
    title_box = doc.add_table(rows=1, cols=1)
    title_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    title_box.autofit = False
    c_title = title_box.cell(0, 0)
    c_title.width = Inches(6.5)
    set_cell_background(c_title, "0F172A") # Slate 900
    set_cell_margins(c_title, top=200, bottom=200, left=240, right=240)
    
    pt = c_title.paragraphs[0]
    pt.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pt.paragraph_format.space_before = Pt(0)
    pt.paragraph_format.space_after = Pt(4)
    run_main_title = pt.add_run("THÈME DU STAGE :\nCONCEPTION ET RÉALISATION D'UNE PLATEFORME WEB PROGRESSIVE (PWA) INSTITUTIONNELLE ET MODULAIRE AVEC INTÉGRATION D'INTELLIGENCE ARTIFICIELLE GÉNÉRATIVE ET VISITE 3D IMMERSIVE\n")
    run_main_title.bold = True
    run_main_title.font.name = "Calibri"
    run_main_title.font.size = Pt(13.5)
    run_main_title.font.color.rgb = RGBColor(255, 255, 255)
    
    run_sub_title = pt.add_run("Dématérialisation des inscriptions, portail de gestion administrative multi-rôles (Scolarité, RH, Communication) et valorisation numérique de l'INPTIC Gabon")
    run_sub_title.font.name = "Calibri"
    run_sub_title.font.size = Pt(10)
    run_sub_title.font.italic = True
    run_sub_title.font.color.rgb = RGBColor(186, 230, 253)

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(14)
    p_sp.paragraph_format.space_after = Pt(0)

    # Encadré Informations
    info_table = doc.add_table(rows=2, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_table.autofit = False
    
    c00 = info_table.cell(0, 0)
    c01 = info_table.cell(0, 1)
    c10 = info_table.cell(1, 0)
    c11 = info_table.cell(1, 1)
    
    c00.width = Inches(3.25)
    c01.width = Inches(3.25)
    c10.width = Inches(3.25)
    c11.width = Inches(3.25)
    
    for c in [c00, c01, c10, c11]:
        set_cell_background(c, "F8FAFC")
        set_cell_margins(c, top=80, bottom=80, left=120, right=120)
        
    p00 = c00.paragraphs[0]
    p00.add_run("Rédigé et présenté par :\n").bold = True
    r_author = p00.add_run("Yesse BOUKINDA MABICKA\n")
    r_author.bold = True
    r_author.font.color.rgb = RGBColor(30, 58, 138)
    p00.add_run("Étudiant chercheur / Stagiaire Développeur")
    
    p01 = c01.paragraphs[0]
    p01.add_run("Sous l'encadrement de :\n").bold = True
    r_enc = p01.add_run("Direction des Systèmes d'Information\n")
    r_enc.bold = True
    r_enc.font.color.rgb = RGBColor(30, 58, 138)
    p01.add_run("Encadreur Technique & Professionnel")
    
    p10 = c10.paragraphs[0]
    p10.add_run("Structure d'accueil :\n").bold = True
    p10.add_run("INPTIC Gabon (Libreville)\nFeux tricolores Gros Bouquet")
    
    p11 = c11.paragraphs[0]
    p11.add_run("Période et Année académique :\n").bold = True
    p11.add_run("Stage d'immersion professionnelle\nSession Académique 2025 — 2026")
    
    doc.add_page_break()

    # =========================================================================
    # DÉDICACE ET REMERCIEMENTS
    # =========================================================================
    add_h1("DÉDICACE")
    add_p("À ma famille, dont le soutien constant, les sacrifices inconditionnels et les encouragements indéfectibles ont constitué le socle inébranlable de mon parcours académique et personnel.", space_after=10)
    add_p("À mes professeurs et formateurs de l'INPTIC, qui m'ont inculqué le sens de la rigueur scientifique, la passion des technologies de pointe et la volonté d'excellence.", space_after=10)
    add_p("À tous les passionnés d'informatique, de numérique et d'innovation en Afrique, qui œuvrent chaque jour avec détermination pour bâtir la souveraineté technologique de notre continent.", space_after=20)

    add_h1("REMERCIEMENTS")
    add_p("L'aboutissement de ce stage et la rédaction de ce rapport sont le fruit d'un travail collectif et d'un accompagnement précieux. Je tiens à exprimer ma profonde et sincère gratitude à toutes les personnes qui ont contribué, de près ou de loin, à la réussite de ce projet.")
    
    add_bullet("À la Direction Générale de l'INPTIC Gabon", "Pour m'avoir ouvert les portes de cette prestigieuse institution, m'avoir accordé leur confiance pour concevoir une plateforme d'une telle envergure stratégique et avoir mis à ma disposition l'environnement logistique et humain nécessaire.")
    add_bullet("À l'équipe pédagogique et à la Direction des Études", "Pour la qualité de l'enseignement dispensé tout au long de mon cycle de formation, leur disponibilité constante et leurs conseils méthodologiques avisés.")
    add_bullet("À mes encadreurs techniques et professionnels au sein de l'institut", "Pour leurs retours critiques constructifs, leur rigueur technique et leur soutien constant durant les phases décisives d'analyse d'architecture, d'intégration de l'intelligence artificielle et de déploiement en production.")
    add_bullet("À l'ensemble du personnel administratif et technique de l'INPTIC (Scolarité, RH, Communication)", "Pour le temps consacré aux ateliers de recueil des besoins, à l'expression fonctionnelle de leurs problématiques métiers quotidiennes et aux tests d'acceptation utilisateur.")
    add_bullet("À mes camarades de promotion", "Pour la fraternité, les partages d'expériences enrichissants et l'émulation intellectuelle tout au long de cette aventure académique.")

    doc.add_page_break()

    # =========================================================================
    # RÉSUMÉ & ABSTRACT
    # =========================================================================
    add_h1("RÉSUMÉ EXÉCUTIF")
    add_p("Dans le contexte contemporain d'accélération de la transition numérique au Gabon, l'Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC) joue un rôle de locomotive académique dans la formation des futurs cadres technologiques du pays. Ce rapport de stage formalise l'étude, la conception et la réalisation complète de la nouvelle plateforme numérique institutionnelle et modulaire de l'INPTIC, développée sous forme d'une Application Web Progressive (PWA).")
    add_p("Le projet répond à une problématique centrale : comment unifier les processus administratifs hétérogènes (inscriptions aux concours, gestion de scolarité, ressources humaines, communication institutionnelle) tout en offrant une vitrine technologique d'excellence intégrant les technologies du Web moderne telles que l'Intelligence Artificielle générative et la 3D interactive ?")
    add_p("Pour répondre à cette problématique, une architecture full-stack modulaire et souveraine a été mise en œuvre, basée sur le framework Next.js 16 (React 19, TypeScript), couplé à une base de données relationnelle PostgreSQL sur infrastructure LWS et à un stockage persistant sécurisé. Les réalisations majeures comprennent :", bold_prefix="Réalisations clés : ")
    add_bullet("1. Dématérialisation des admissions", "Un portail d'e-admission complet permettant la création de compte candidat, le dépôt sécurisé de pièces justificatives, le suivi en temps réel du statut d'instruction et la génération automatique d'une quittance numérique après pré-validation et paiement Mobile Money.")
    add_bullet("2. Assistant Virtuel IA multi-fournisseurs", "Un chatbot conversationnel alimenté par Google Gemini (Pro et Flash avec recherche web et interpréteur Python), interfaçable dynamiquement depuis un panneau superadmin avec OpenAI, Anthropic Claude, Groq, DeepSeek et Ollama via chiffrement AES-256 des clés, couplé à une synthèse vocale (TTS) naturelle.")
    add_bullet("3. Visite virtuelle immersive 3D du campus", "Une expérience WebGL interactive exploitant Three.js et React Three Fiber à partir de la modélisation Blender du campus, permettant aux futurs étudiants et partenaires d'explorer virtuellement les bâtiments et infrastructures.")
    add_bullet("4. Espaces de travail métiers étanches (RBAC)", "Des interfaces de gestion sur-mesure pour la Scolarité, la Direction des Études, la Direction Générale, la Communication (veille automatisée, e-réputation, newsletter) et les Ressources Humaines (génération de cartes professionnelles avec QR Code sécurisé et traçabilité par journal d'audit).")
    add_bullet("5. Écosystème étudiant et PWA multilingue", "Gestion des clubs et associations, annuaire Alumni avec recadrage de photo, catalogue scientifique et internationalisation complète en quatre langues (Français, Anglais, Chinois, Arabe).")
    add_p("Ce stage m'a permis de consolider une double compétence d'architecte logiciel full-stack et de chef de projet agile, tout en apportant à l'INPTIC un outil numérique souverain, moderne, hautement sécurisé et parfaitement aligné sur les exigences de l'enseignement supérieur contemporain.")
    add_p("Mots-clés : INPTIC Gabon, Progressive Web App (PWA), Next.js, React, TypeScript, PostgreSQL, Intelligence Artificielle Générative, Gemini Pro, WebGL, Three.js, RBAC, Dématérialisation administrative, Mobile Money, Sécurité des données.", bold_prefix="Mots-clés : ", space_after=16)

    add_h1("ABSTRACT")
    add_p("In the context of the rapid digital transition in Gabon, the National Institute of Posts, Information and Communication Technologies (INPTIC) stands as a premier academic leader in educating future technological executives. This internship report documents the comprehensive research, architectural design, and full-stack development of INPTIC's new institutional and modular digital platform, built as a Progressive Web Application (PWA).")
    add_p("The core challenge addressed in this project was how to unify disparate administrative workflows (admissions, academic administration, human resources, institutional communication) while establishing an innovative technological showcase featuring state-of-the-art Web technologies, including Generative Artificial Intelligence and interactive 3D WebGL visualization.")
    add_p("To overcome these challenges, a sovereign, modular full-stack architecture was engineered using Next.js 16 (React 19, TypeScript), backed by a production-ready PostgreSQL relational database on LWS infrastructure and secure persistent storage. The key deliverables encompass: (1) an end-to-end e-admissions and candidate portal with document upload, status tracking, Mobile Money payment workflow, and automated digital receipts; (2) a multi-provider AI chatbot powered by Google Gemini with live web grounding, dynamic superadmin provider switching (OpenAI, Claude, Groq, Ollama) via AES-256 key encryption, and server-side text-to-speech; (3) an interactive 3D virtual campus tour built with Three.js and React Three Fiber; (4) strictly isolated role-based administration dashboards (RBAC) for Admissions, Studies, Executive Board, PR/Communication, and HR with encrypted QR code staff card generation and audit trail logging; and (5) a fully multilingual (FR, EN, ZH, AR) PWA environment.")
    add_p("Keywords: INPTIC Gabon, Progressive Web App (PWA), Next.js, React, TypeScript, PostgreSQL, Generative AI, Gemini, WebGL, Three.js, RBAC, Paperless Administration, Mobile Money, Data Security.", bold_prefix="Keywords: ")

    doc.add_page_break()

    # =========================================================================
    # SOMMAIRE / TABLE DES MATIÈRES DÉTAILLÉE
    # =========================================================================
    add_h1("TABLE DES MATIÈRES")
    
    toc_items = [
        ("DÉDICACE & REMERCIEMENTS", "2"),
        ("RÉSUMÉ EXÉCUTIF & ABSTRACT", "3"),
        ("TABLE DES MATIÈRES", "4"),
        ("GLOSSAIRE ET SIGLES", "6"),
        ("LISTE DES FIGURES", "7"),
        ("LISTE DES TABLEAUX", "8"),
        ("INTRODUCTION GÉNÉRALE", "9"),
        ("    1. Contexte général du secteur numérique au Gabon", "9"),
        ("    2. Objectifs du projet et enjeux stratégiques", "10"),
        ("    3. Problématique centrale", "11"),
        ("    4. Méthodologie adoptée (Agile Scrum et DevOps)", "12"),
        ("    5. Présentation brève de la structure d'accueil (INPTIC Gabon)", "13"),
        ("    6. Missions et responsabilités confiées", "14"),
        ("DÉVELOPPEMENT — BLOC 1 : PRÉSENTATION DÉTAILLÉE DE L'INSTITUT", "15"),
        ("    1.1 Historique, statut juridique et tutelle ministérielle", "15"),
        ("    1.2 Missions fondamentales, vocation et vision stratégique", "16"),
        ("    1.3 Organisation fonctionnelle, gouvernance et organigramme", "17"),
        ("    1.4 Départements pédagogiques et filières de formation", "19"),
        ("    1.5 Infrastructures techniques, laboratoires et partenariats", "21"),
        ("DÉVELOPPEMENT — BLOC 2 : ACTIVITÉS RÉALISÉES EN STAGE", "23"),
        ("    2.1 Spécifications du cahier des charges et périmètre fonctionnel", "23"),
        ("    2.2 Méthode d'ingénierie logicielle et modélisation architecturale", "25"),
        ("    2.3 Environnement technique, outils et choix technologiques", "27"),
        ("    2.4 Implémentation technique approfondie des modules :", "29"),
        ("        2.4.1 Authentification sécurisée, sessions HttpOnly et contrôle d'accès RBAC", "29"),
        ("        2.4.2 Portail d'E-Admission, téléversement sécurisé et quittance Mobile Money", "31"),
        ("        2.4.3 Assistant Virtuel IA multi-modèles (Gemini, OpenAI, Claude) et TTS vocal", "33"),
        ("        2.4.4 Visite virtuelle 3D interactive du campus (Three.js / React Three Fiber)", "35"),
        ("        2.4.5 Espaces métiers : Scolarité, Direction Générale, RH, Communication", "37"),
        ("        2.4.6 Écosystème étudiant (Clubs, Alumni), PWA et Internationalisation (i18n)", "40"),
        ("    2.5 Résultats obtenus et métriques de validation", "42"),
        ("    2.6 Difficultés techniques rencontrées et solutions innovantes apportées", "44"),
        ("DÉVELOPPEMENT — BLOC 3 : BILAN DE LA MISSION ET RETOUR D'EXPÉRIENCE", "46"),
        ("    3.1 Compétences techniques et méthodologiques acquises", "46"),
        ("    3.2 Développement personnel, savoir-être et compétences transversales", "47"),
        ("    3.3 Valeur ajoutée et retombées directes pour l'INPTIC Gabon", "48"),
        ("CONCLUSION GÉNÉRALE", "49"),
        ("    1. Synthèse des résultats et objectifs atteints", "49"),
        ("    2. Apports personnels et académiques", "50"),
        ("    3. Perspectives d'évolution futures", "50"),
        ("BIBLIOGRAPHIE ET WEBOGRAPHIE", "51"),
        ("ANNEXES TECHNIQUES", "53"),
        ("    Annexe A : Schéma de données relationnel PostgreSQL complet", "53"),
        ("    Annexe B : Extraits de code source structurants (RBAC et API Chatbot IA)", "55"),
        ("    Annexe C : Procédure opérationnelle de déploiement en production (LWS)", "57"),
    ]
    
    for title, page in toc_items:
        p_toc = doc.add_paragraph()
        p_toc.paragraph_format.space_before = Pt(1)
        p_toc.paragraph_format.space_after = Pt(1)
        p_toc.paragraph_format.tab_stops.add_tab_stop(Inches(6.5))
        
        is_main = title.startswith("DÉVELOPPEMENT") or title.startswith("INTRODUCTION") or title.startswith("CONCLUSION") or title.startswith("BIBLIO") or title.startswith("ANNEXES")
        r_t = p_toc.add_run(title)
        r_t.font.name = "Calibri"
        r_t.font.size = Pt(10 if not is_main else 10.5)
        if is_main:
            r_t.bold = True
            r_t.font.color.rgb = RGBColor(15, 23, 42)
        else:
            r_t.font.color.rgb = RGBColor(51, 65, 85)
            
        r_dots = p_toc.add_run("\t")
        r_p = p_toc.add_run(page)
        r_p.font.name = "Calibri"
        r_p.font.size = Pt(10)
        r_p.bold = is_main
        r_p.font.color.rgb = RGBColor(2, 132, 199) if is_main else RGBColor(100, 116, 139)

    doc.add_page_break()

    # =========================================================================
    # GLOSSAIRE ET SIGLES
    # =========================================================================
    add_h1("GLOSSAIRE ET SIGLES")
    
    glossary = [
        ("INPTIC", "Institut National de la Poste, des Technologies de l'Information et de la Communication (Libreville, Gabon)."),
        ("PWA", "Progressive Web Application (Application Web Progressive offrant des capacités hors-ligne et installable comme une application native)."),
        ("API", "Application Programming Interface (Interface de programmation applicative permettant la communication entre composants logiciels)."),
        ("REST", "Representational State Transfer (Style d'architecture logicielle standard pour les services Web sans état)."),
        ("RBAC", "Role-Based Access Control (Contrôle d'accès basé sur les rôles et habilitations d'un utilisateur)."),
        ("CMS", "Content Management System (Système de gestion de contenu pour l'administration éditoriale de données)."),
        ("DBMS / SGBD", "Système de Gestion de Base de Données Relationnelle (ex. PostgreSQL)."),
        ("JWT", "JSON Web Token (Format compact et sécurisé pour l'échange de revendications cryptographiques)."),
        ("LLM", "Large Language Model (Modèle de langage de grande taille d'intelligence artificielle générative)."),
        ("TTS", "Text-To-Speech (Synthèse vocale automatique convertissant du texte en signal audio naturel)."),
        ("WebGL", "Web Graphics Library (API JavaScript permettant d'afficher des graphismes 3D interactifs dans le navigateur sans plug-in)."),
        ("Three.js", "Bibliothèque JavaScript open-source facilitant la création et l'animation de scènes 3D WebGL."),
        ("R3F", "React Three Fiber (Réconciliateur React pour la bibliothèque 3D Three.js)."),
        ("SSR", "Server-Side Rendering (Rendu des composants HTML effectué côté serveur avant expédition au client)."),
        ("CSR", "Client-Side Rendering (Rendu exécuté directement par le moteur JavaScript du navigateur client)."),
        ("RSC", "React Server Components (Composants React s'exécutant exclusivement sur le serveur sans alourdir le bundle client)."),
        ("ORM", "Object-Relational Mapping (Technique de correspondance entre les objets métier et le modèle relationnel)."),
        ("ANDG", "Agence Nationale du Numérique du Gabon."),
        ("AES-256", "Advanced Encryption Standard 256 bits (Algorithme de chiffrement symétrique haute sécurité)."),
        ("Scrypt", "Fonction de dérivation de clé cryptographique et de hachage hautement résistante aux attaques par force brute."),
        ("LWS", "Ligne Web Services (Hébergeur web français fournissant l'infrastructure serveur Node.js et PostgreSQL)."),
        ("SMTP", "Simple Mail Transfer Protocol (Protocole standard de transmission des courriers électroniques)."),
        ("CORS", "Cross-Origin Resource Sharing (Mécanisme de sécurité régulant les requêtes entre domaines d'origines différentes)."),
        ("UI / UX", "User Interface / User Experience (Interface Utilisateur et Expérience Utilisateur)."),
    ]
    
    add_table_styled(["Acronyme / Sigle", "Définition et Signification Technique"], glossary, [2.0, 4.5])

    doc.add_page_break()

    # =========================================================================
    # LISTE DES FIGURES ET TABLEAUX
    # =========================================================================
    add_h1("LISTE DES FIGURES")
    figures = [
        ("Figure 1", "Organigramme hiérarchique et structure de gouvernance de l'INPTIC Gabon", "18"),
        ("Figure 2", "Architecture globale en couches de la plateforme web Next.js 16 (Full-Stack Monolith)", "26"),
        ("Figure 3", "Diagramme de cas d'utilisation global des différents profils utilisateurs (RBAC)", "28"),
        ("Figure 4", "Cycle de vie et machine à états d'une candidature au concours d'admission", "32"),
        ("Figure 5", "Schéma séquentiel du flux de traitement de l'Assistant IA multi-fournisseurs avec fallback vocal", "34"),
        ("Figure 6", "Pipeline de rendu 3D temps réel du campus sous Three.js et React Three Fiber", "36"),
        ("Figure 7", "Architecture du système de génération dynamique des cartes professionnelles avec QR Code", "39"),
        ("Figure 8", "Schéma de la base de données relationnelle PostgreSQL et intégrité référentielle", "54"),
    ]
    add_table_styled(["Réf.", "Intitulé descriptif de la Figure", "Page"], figures, [1.0, 4.5, 1.0])

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(14)

    add_h1("LISTE DES TABLEAUX")
    tables_list = [
        ("Tableau 1", "Matrice des habilitations et profils d'accès aux espaces applicatifs (RBAC)", "24"),
        ("Tableau 2", "Technologies, frameworks et versions logicielles retenues dans le projet", "27"),
        ("Tableau 3", "Comparatif technique et performances des fournisseurs de modèles IA intégrés", "35"),
        ("Tableau 4", "Planning prévisionnel et chronogramme de réalisation des Sprints Agile", "43"),
        ("Tableau 5", "Matrice d'analyse des risques techniques, impacts et stratégies de mitigation", "45"),
        ("Tableau 6", "Dictionnaire synthétique des principales tables de la base PostgreSQL", "53"),
    ]
    add_table_styled(["Réf.", "Intitulé descriptif du Tableau", "Page"], tables_list, [1.0, 4.5, 1.0])

    doc.add_page_break()

    # =========================================================================
    # INTRODUCTION GÉNÉRALE
    # =========================================================================
    add_h1("INTRODUCTION GÉNÉRALE")
    
    add_h2("1. Contexte général du secteur numérique au Gabon")
    add_p("Le Gabon s'est résolument engagé depuis plus d'une décennie dans une politique volontariste de diversification économique et de transformation structurelle à travers le développement accéléré de son économie numérique. Dans un monde interconnecté où la donnée et les technologies de l'information constituent le levier primordial de la compétitivité et de la souveraineté nationale, le rôle des institutions d'enseignement supérieur et de recherche spécialisées devient hautement stratégique.")
    add_p("L'Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC), établissement public sous la tutelle du Ministère de la Communication et de l'Économie Numérique, se positionne comme le fer de lance de cette ambition nationale. Fondé pour former l'élite gabonaise et sous-régionale dans les métiers des télécommunications, du génie logiciel, des réseaux, de la cybersécurité et du multimédia, l'institut doit faire face à une double exigence :")
    add_bullet("Excellence académique et technologique", "Délivrer des formations adaptées aux standards internationaux et aux besoins croissants des entreprises du secteur public et privé.")
    add_bullet("Modernisation de sa propre gouvernance numérique", "Projeter une image de marque institutionnelle à la hauteur de son expertise technique et offrir à son écosystème (étudiants, candidats, enseignants, partenaires) des services en ligne réactifs, fiables et sécurisés.")

    add_h2("2. Objectifs du projet et enjeux stratégiques")
    add_p("Le projet confié durant ce stage d'immersion professionnelle s'inscrit au cœur même de cette trajectoire de modernisation. L'objectif fondamental était de concevoir, développer et déployer une plateforme numérique intégrale, unifiée et modulaire, capable de remplacer les processus manuels et les outils fragmentés existants par un écosystème logiciel haute performance.")
    add_p("Les enjeux stratégiques identifiés pour l'INPTIC sont multiples :", bold_prefix="Enjeux institutionnels : ")
    add_bullet("Souveraineté et centralisation des données", "Regrouper l'ensemble des données critiques (comptes utilisateurs, dossiers de candidatures, profils du personnel, annonces officielles, diplômés) au sein d'une infrastructure de base de données relationnelle maîtrisée.")
    add_bullet("Dématérialisation complète de la chaîne d'admission", "Permettre à des milliers de bacheliers et professionnels de créer un compte candidat, téléverser leurs pièces justificatives, suivre en temps réel la recevabilité de leur candidature et obtenir une quittance numérique sécurisée.")
    add_bullet("Transformation de l'expérience utilisateur grâce à l'IA", "Intégrer un assistant conversationnel intelligent capable de guider les usagers 24h/24 en langage naturel et avec restitution vocale, libérant ainsi les équipes de scolarité des questions répétitives.")
    add_bullet("Attractivité et rayonnement immersif", "Offrir aux futurs étudiants et délégations internationales une visite 3D photoréaliste et interactive des infrastructures du campus de Gros-Bouquet directement depuis leur navigateur web.")

    add_h2("3. Problématique centrale")
    add_p("Dans le cadre de cette transformation, l'INPTIC faisait face à plusieurs défis architecturaux et opérationnels complexes :", bold_prefix="Constat initial : ")
    add_p("Comment concevoir, structurer et déployer une plateforme logicielle unifiée, hautement sécurisée, ergonomique et résiliente, capable d'orchestrer des flux métiers hautement hétérogènes (de la candidature publique au suivi RH confidentiel) tout en intégrant des innovations technologiques de pointe (Intelligence Artificielle générative multi-modèles, synthèse vocale, rendu 3D WebGL et PWA mobile) sur une infrastructure d'hébergement contrainte en ressources ?")
    add_p("Cette problématique générale se décompose en plusieurs questions opérationnelles et scientifiques sous-jacentes :")
    add_bullet("Q1. Cloisonnement et sécurité des accès", "Comment garantir l'étanchéité stricte des données entre la Scolarité, la Direction des Études, la Communication et les Ressources Humaines tout en maintenant une authentification unique et centralisée ?")
    add_bullet("Q2. Performance sous contrainte d'infrastructure", "Comment faire cohabiter des technologies exigeantes (Next.js 16, Three.js 3D, Strapi CMS) sur un serveur mutualisé LWS sans provoquer de saturation mémoire (OOM) lors des phases de build et d'exécution ?")
    add_bullet("Q3. Flexibilité et pérennité de l'IA", "Comment intégrer un modèle de langage avancé comme Google Gemini tout en prévoyant une bascule sécurisée sans interruption de service vers d'autres fournisseurs (OpenAI, Claude, Groq, Ollama) en cas de rupture de quota ou d'évolution tarifaire ?")

    add_h2("4. Méthodologie adoptée (Agile Scrum et DevOps)")
    add_p("Pour répondre avec succès à ce cahier des charges ambitieux et s'adapter aux ajustements constants des parties prenantes, nous avons adopté une méthodologie Agile inspirée du cadre Scrum, combinée à une rigueur d'ingénierie DevOps :")
    add_bullet("Approche itérative par Sprints", "Le projet a été segmenté en 4 sprints majeurs de 2 à 3 semaines chacun, jalonnés par des démonstrations fonctionnelles auprès des responsables de services (Directeur Général, Responsable Scolarité, DSI).")
    add_bullet("Conception 'Schema-First' et typage statique strict", "Chaque fonctionnalité a été précédée par la formalisation de son schéma de données relationnel (migrations SQL numérotées) et par un typage TypeScript strict pour éliminer les régressions à l'exécution.")
    add_bullet("Démarche 'Mobile-First' et PWA", "L'interface a été conçue pour offrir une ergonomie fluide sur smartphone (terminaux Android/iOS majoritaires chez les étudiants gabonais) avant d'être optimisée pour les écrans de bureau.")

    add_h2("5. Présentation brève de la structure d'accueil (INPTIC Gabon)")
    add_p("L'Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC), localisé à Libreville au carrefour Gros-Bouquet, est l'établissement supérieur d'enseignement public de référence au Gabon dédié aux métiers du secteur postal et des technologies de l'information. Sous la tutelle du Ministère de la Communication et de l'Économie Numérique, l'institut assure la formation initiale et continue d'ingénieurs des travaux, techniciens supérieurs et cadres hautement qualifiés. L'institut dispose d'amphithéâtres, de laboratoires informatiques et réseaux équipés, d'un incubateur technologique et d'un campus moderne accueillant plusieurs centaines d'étudiants chaque année.")

    add_h2("6. Missions et responsabilités confiées au stagiaire")
    add_p("En tant qu'ingénieur stagiaire et développeur principal de la nouvelle plateforme, mes responsabilités ont couvert l'intégralité du cycle de vie du produit logiciel (SDLC) :")
    add_bullet("1. Analyse des besoins et rédaction du cahier des charges", "Recueil des exigences auprès de la Direction Générale, de la Scolarité, des Ressources Humaines et du service Communication ; modélisation fonctionnelle et cartographie des habilitations.")
    add_bullet("2. Architecture logicielle et modélisation de données", "Conception du modèle relationnel PostgreSQL (scripts de migration 00 à 23), définition de l'architecture Next.js 16 (App Router), configuration du pool de connexions et stratégie de gestion des sessions sécurisées.")
    add_bullet("3. Développement Full-Stack des modules applicatifs", "Développement des composants d'interface React 19 / Tailwind CSS v4, programmation des routes serveur API sécurisées, intégration du module de préinscription et gestion des documents administratifs.")
    add_bullet("4. Intégration de l'Intelligence Artificielle et de la synthèse vocale", "Conception du Chatbot INPTIC avec l'AI SDK et Google Gemini Pro/Flash, développement du panneau de configuration multi-modèles avec chiffrement AES-256 et mise en œuvre du pipeline TTS vocal.")
    add_bullet("5. Modélisation et intégration de la scène 3D interactive", "Optimisation de la maquette Blender du campus et programmation de la visite immersive WebGL avec Three.js et React Three Fiber.")
    add_bullet("6. Déploiement en production et assurance qualité", "Mise en service sur les serveurs LWS, optimisation mémoire de Webpack, configuration SMTP pour les notifications et transfert de compétences.")

    doc.add_page_break()

    # =========================================================================
    # DÉVELOPPEMENT — BLOC 1 : PRÉSENTATION DÉTAILLÉE DE L'INSTITUT
    # =========================================================================
    add_h1("DÉVELOPPEMENT — BLOC 1 : PRÉSENTATION DÉTAILLÉE DE L'INPTIC GABON")
    
    add_h2("1.1 Historique, statut juridique et tutelle ministérielle")
    add_p("L'Institut National de la Poste, des Technologies de l'Information et de la Communication (INPTIC) puise ses racines historiques dans la volonté des plus hautes autorités gabonaises de se doter d'une institution nationale capable d'assurer la souveraineté du pays dans les secteurs névralgiques des postes et télécommunications. Érigé en établissement public d'enseignement supérieur professionnel doté de la personnalité morale et de l'autonomie financière, l'INPTIC a vu ses compétences s'élargir au fil des décrets présidentiels et ministériels pour englober l'ensemble du spectre du numérique moderne (génie logiciel, cybersécurité, multimédia, gouvernance des TIC).")
    add_p("Placé sous la tutelle technique du Ministère de la Communication et de l'Économie Numérique et sous la tutelle pédagogique du Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation Technologique, l'INPTIC constitue l'instrument privilégié de l'État pour l'implémentation du volet académique de la stratégie nationale 'Gabon Numérique'.")

    add_h2("1.2 Missions fondamentales, vocation et vision stratégique")
    add_p("L'INPTIC a pour mission générale de promouvoir l'enseignement supérieur professionnel, la recherche appliquée et l'innovation technologique dans les domaines des télécommunications, de l'informatique, des services postaux et du multimédia. Ses missions fondamentales s'articulent autour de quatre piliers majeurs :")
    add_bullet("Formation Initiale d'Excellence", "Former des techniciens supérieurs (BTS / DUT) et des ingénieurs des travaux (Licences professionnelles et Masters spécialisés) opérationnels dès leur sortie, capables de concevoir, déployer, maintenir et sécuriser des infrastructures logicielles et matérielles complexes.")
    add_bullet("Formation Continue et Perfectionnement des Cadres", "Accompagner la montée en compétences des professionnels en exercice au sein des administrations publiques, des opérateurs de télécommunications (Airtel, Moov Africa), des institutions bancaires et des PME innovantes.")
    add_bullet("Recherche Appliquée et Innovation Technologique", "Développer des projets de recherche appliquée orientés vers les problématiques de développement local, notamment l'intelligence artificielle, l'internet des objets (IoT), la protection des infrastructures critiques et la dématérialisation des services publics.")
    add_bullet("Certifications et Insertion Professionnelle", "Servir de centre d'examen et de certification accrédité pour les plus grands standards industriels internationaux (Cisco CCNA/CCNP, Microsoft Azure, Linux Professional Institute, Oracle, Huawei HCIA/HCIP).")

    add_h2("1.3 Organisation fonctionnelle, gouvernance et organigramme")
    add_p("L'INPTIC est administré par des organes délibératifs et consultatifs et dirigé par une équipe managériale expérimentée assurant la gestion quotidienne de l'institution.")
    add_p("La gouvernance de l'institut comprend :", bold_prefix="Organes de direction : ")
    add_bullet("Le Conseil d'Administration (CA)", "Organe suprême d'orientation stratégique, réunissant des représentants des ministères de tutelle, des représentants du secteur privé des télécommunications et des délégués académiques.")
    add_bullet("La Direction Générale (DG)", "Responsable de la mise en œuvre de la politique générale de l'établissement, de la représentation légale, de la diplomatie universitaire et du pilotage des partenariats stratégiques.")
    add_bullet("La Direction des Études et de la Pédagogie (DEP)", "En charge de l'organisation des programmes d'enseignement, de la gestion des corps professoraux, de la supervision des examens, des jurys de diplôme et de la politique d'assurance qualité académique.")
    add_bullet("La Direction de la Formation Continue et des Certifications", "Responsable des cursus professionnels courts, de l'accompagnement des entreprises partenaires et de l'administration des examens de certification internationale.")
    add_bullet("La Direction des Ressources Techniques et de l'Innovation (DRTI)", "Garante du fonctionnement optimal des réseaux informatiques, des serveurs, des laboratoires technologiques, du parc machine et de la coordination des projets d'innovation.")
    add_bullet("Le Secrétariat Général (SG) et la Direction des Ressources Humaines (DRH)", "Assurant la gestion administrative, la conformité légale, la gestion des carrières du personnel enseignant et administratif, la logistique et les finances.")

    add_callout("L'organigramme de l'INPTIC a guidé directement la conception du système de gestion des habilitations (RBAC) de la nouvelle plateforme. Chaque direction métier correspond à un espace opérationnel strictement étanche au niveau du code serveur et de la base de données.", "ALIGNEMENT ORGANISATIONNEL & LOGICIEL")

    add_h2("1.4 Départements pédagogiques et filières de formation")
    add_p("L'INPTIC structure son offre de formation initiale et certifiante autour de pôles de compétences technologiques d'avant-garde :")
    add_bullet("Pôle Réseaux et Systèmes Numériques (RSN)", "Formations axées sur l'architecture réseau, l'interconnexion, la virtualisation, l'administration système Linux/Windows Server, les réseaux mobiles (4G/5G) et la transmission par fibre optique.")
    add_bullet("Pôle Génie Logiciel et Développement d'Applications (GL)", "Apprentissage approfondi de l'ingénierie logicielle, des architectures microservices, des technologies web full-stack modernes (React, Next.js, Node.js), des bases de données SQL/NoSQL et des méthodes de développement agile.")
    add_bullet("Pôle Cybersécurité et Protection des Données (CYBER)", "Formation à l'analyse de vulnérabilités, aux tests d'intrusion éthiques (pentest), à la sécurité des périmètres réseaux, à la cryptographie appliquée et à la gouvernance des risques numériques selon les normes ISO 27001.")
    add_bullet("Pôle Audiovisuel et Création Numérique (AV)", "Spécialisation dans les technologies de diffusion audiovisuelle, le montage numérique, les effets visuels, la modélisation 3D et le motion design.")
    add_bullet("Pôle Management des TIC et Économie Numérique (MTIC)", "Gestion de projets technologiques, marketing digital, entrepreneuriat web, droit du numérique et e-gouvernance.")

    add_h2("1.5 Infrastructures techniques, laboratoires et partenariats")
    add_p("Implanté sur le site stratégique de Gros-Bouquet à Libreville, le campus de l'INPTIC dispose d'infrastructures physiques et numériques adaptées aux exigences de l'enseignement technique contemporain :")
    add_bullet("Laboratoires spécialisés", "Salles machines dédiées à la programmation, laboratoires réseaux Cisco équipés de routeurs et commutateurs physiques modulaires, salle de télécommunications et studio d'enregistrement audiovisuel.")
    add_bullet("Incubateur Technologique INPTIC Tech Hub", "Espace d'idéation et d'accélération accompagnant les étudiants porteurs de projets innovants vers la création de startups numériques viables.")
    add_bullet("Écosystème de partenaires institutionnels et industriels", "Partenariats solides tissés avec l'Agence Nationale du Numérique du Gabon (ANDG), l'ARCEP, les opérateurs de télécommunications, ainsi que des conventions de coopération académique avec des universités partenaires de la sous-région et à l'international (France, Maroc, Sénégal, Chine).")

    doc.add_page_break()

    # =========================================================================
    # DÉVELOPPEMENT — BLOC 2 : ACTIVITÉS RÉALISÉES EN STAGE
    # =========================================================================
    add_h1("DÉVELOPPEMENT — BLOC 2 : ACTIVITÉS RÉALISÉES EN STAGE (INGÉNIERIE & IMPLÉMENTATION)")
    
    add_h2("2.1 Spécifications du cahier des charges et périmètre fonctionnel")
    add_p("Le cahier des charges validé conjointement avec la Direction Générale et la DSI a fixé un périmètre fonctionnel très précis. La plateforme devait agir à la fois comme un portail institutionnel d'attractivité internationale, une application de dématérialisation des processus académiques et un outil de travail collaboratif pour les départements de l'institut.")
    add_p("Les exigences ont été formalisées selon une matrice détaillée de profils d'utilisateurs et d'habilitations :", bold_prefix="Exigences d'accès : ")

    matrix_data = [
        ["Visiteur public", "Consultation du catalogue, visite 3D, chat IA, actualités", "Lecture publique sans authentification"],
        ["Candidat au concours", "Création de compte, préinscription, upload pièces, quittance", "Espace candidat sécurisé (rôle 'candidat')"],
        ["Étudiant inscrit", "Consultation des cours, emplois du temps, relevés, clubs", "Espace étudiant (rôle 'etudiant')"],
        ["Scolarité", "Instruction des dossiers, validation/rejet, attestations", "Accès restreint au service 'scolarite'"],
        ["Direction des Études", "Supervision pédagogique, statistiques académiques", "Accès restreint au service 'direction_etudes'"],
        ["Communication", "Gestion des annonces, actualités, newsletter, veille", "Accès restreint au service 'communication'"],
        ["Ressources Humaines", "Annuaire du personnel, cartes QR Code, logs d'audit", "Accès restreint aux services 'rh' et 'drh'"],
        ["Directeur Général (DG)", "Tableau de bord décisionnel, indicateurs, mot du DG", "Accès directionnel ('directeur')"],
        ["Superadministrateur", "Gestion des comptes staff, réglages IA, maintenance DB", "Plein accès souverain ('superadmin')"],
    ]
    add_table_styled(["Profil Utilisateur", "Fonctionnalités & Périmètre Opérationnel", "Niveau d'Habilitation"], matrix_data, [1.6, 3.2, 1.7])

    add_h2("2.2 Méthode d'ingénierie logicielle et modélisation architecturale")
    add_p("Afin d'assurer la robustesse et la scalabilité du système, nous avons opté pour une architecture Full-Stack en Monolithe Modulaire basée sur Next.js 16 avec l'App Router. Contrairement à une architecture en microservices qui aurait introduit une complexité d'exploitation excessive pour l'hébergement ciblé, le monolithe modulaire permet une cohésion forte du code, un partage direct des modèles TypeScript entre frontend et backend, et des performances de rendu optimales.")
    
    add_p("L'architecture logicielle s'articule en couches strictement séparées :", bold_prefix="Couches applicatives : ")
    add_bullet("Couche Présentation (Frontend React 19)", "Composants React modulaires, pages rendues côté serveur (RSC) pour le référencement naturel (SEO) et composants interactifs 'use client' pour les formulaires réactifs et la visite 3D.")
    add_bullet("Couche Logique Métier & Contrôleurs (Next.js API Routes)", "Points de terminaison HTTP sécurisés sous `app/api/` validant les requêtes, contrôlant les sessions chiffrées et appliquant les règles métier strictes.")
    add_bullet("Couche Modèle & Persistance (PostgreSQL LWS)", "Gestion directe de la connexion via le driver natif `pg` avec pool de connexions optimisé, éliminant la surcharge des ORM lourds.")
    add_bullet("Couche Stockage Fichiers Privés", "Stockage persistant sur disque sécurisé accessible uniquement par le serveur applicatif sans aucune exposition d'URL publique directe pour les pièces des candidats.")
    add_bullet("Couche Intégrations Tiers", "Passerelles vers Google Gemini AI SDK, passerelles SMTP LWS pour les courriels transactionnels, API Facebook Graph et YouTube Data pour l'e-réputation, et CMS Strapi 5 pour les contenus pédagogiques.")

    add_h2("2.3 Environnement technique, outils et choix technologiques")
    add_p("Le choix des technologies s'est appuyé sur une évaluation rigoureuse de la pérennité, des performances, de la typographie de sécurité et de la légèreté d'exécution :")

    tech_data = [
        ["Framework Web", "Next.js 16.3.4 (App Router)", "Rendu hybride SSR/RSC/CSR, routing optimisé et routes API intégrées."],
        ["Bibliothèque UI", "React 19.1.0", "Dernière version majeure de React avec gestion fluide des états concurrents."],
        ["Langage", "TypeScript 5.7.0", "Typage statique strict, suppression des erreurs d'incompatibilité à l'exécution."],
        ["Feuilles de style", "Tailwind CSS v4.1.0", "Framework CSS utilitaire moderne et compilateur ultra-rapide `@tailwindcss/postcss`."],
        ["Moteur 3D WebGL", "Three.js & React Three Fiber", "Rendu graphique 3D matériellement accéléré dans le navigateur."],
        ["Base de Données", "PostgreSQL 15+ (LWS)", "SGBD relationnel robuste gérant types UUID, JSONB et transactions ACID."],
        ["Authentification", "Sessions HttpOnly & Scrypt", "Hachage cryptographique avancé et cookies sécurisés anti-XSS et anti-CSRF."],
        ["Intelligence Artificielle", "Google Gemini AI SDK & TTS", "Modèles multimodaux Gemini 3.1 Pro / Flash avec recherche Google et voix Achernar."],
        ["CMS Headless", "Strapi 5.55.1", "CMS open-source headless pour la gestion modulaire du catalogue de cours."],
        ["Génération QR Code", "qrcode library", "Génération vectorielle de QR Codes cryptés pour les cartes professionnelles."],
        ["Internationalisation", "i18next & react-i18next", "Prise en charge native du Français, Anglais, Chinois Mandarin et Arabe."],
    ]
    add_table_styled(["Domaine / Rôle", "Technologie Retenue", "Justification & Valeur Technique"], tech_data, [1.5, 2.0, 3.0])

    add_h2("2.4 Implémentation technique approfondie des modules")
    
    add_h3("2.4.1 Module 1 : Authentification sécurisée, sessions HttpOnly et contrôle d'accès RBAC")
    add_p("La sécurité des identités constituait le prérequis absolu pour l'intégrité de la plateforme. Nous avons proscrit les solutions d'authentification tierces opaques (type Firebase ou Auth0 externe) au profit d'un système souverain directement intégré dans PostgreSQL.")
    add_p("Lors de l'inscription ou de la création d'un compte staff, le mot de passe est immédiatement salé et haché à l'aide de l'algorithme `scrypt`, reconnu pour sa résistance maximale aux attaques par dictionnaires et processeurs spécialisés (ASIC/GPU). Lors de la connexion réussie, le serveur génère un jeton de session cryptographique aléatoire de 256 bits, inséré dans la table `user_sessions` avec une date d'expiration. Ce jeton est renvoyé au client exclusivement dans un cookie portant les drapeaux HttpOnly (inaccessible depuis JavaScript pour contrer les attaques XSS), Secure (transmis uniquement via HTTPS) et SameSite=Lax (protection native contre les attaques CSRF).")
    add_p("Le contrôle d'accès par rôle (RBAC) est centralisé dans le module serveur `lib/roles.ts`. Chaque route API vérifie systématiquement la session, résout l'utilisateur et confronte son rôle (`scolarite`, `rh`, `communication`, `direction_etudes`, `directeur`, `superadmin`) avec le périmètre demandé. Aucune décision d'habilitation n'est confiée au navigateur client.")

    add_code_snippet(
"""// Extrait simplifié du contrôle RBAC serveur (lib/roles.ts)
export function getStaffRole(value: unknown): StaffRole | '' {
  const role = normalizeRole(value);
  if (role === 'admin' || role === 'superadmin') return 'admin';
  if (role === 'scolarite' || role === 'direction_etudes') return role;
  if (role === 'communication') return 'communication';
  return '';
}

export function isSuperAdminRole(value: unknown): boolean {
  return normalizeRole(value) === 'superadmin';
}""", caption="Normalisation et validation des rôles administratifs")

    add_h3("2.4.2 Module 2 : Portail d'E-Admission, téléversement sécurisé et quittance Mobile Money")
    add_p("Le parcours d'admission a été entièrement repensé pour offrir une expérience fluide au candidat tout en automatisant le travail d'instruction de la scolarité. Le workflow comprend :")
    add_bullet("Étape 1 : Formulaire d'inscription structuré", "Saisie de l'état civil, du parcours académique antérieur, de la filière demandée à l'INPTIC et de la lettre de motivation.")
    add_bullet("Étape 2 : Téléversement des justificatifs", "Dépôt obligatoire des pièces (diplôme du baccalauréat, acte de naissance, relevés de notes, photo d'identité). Les fichiers sont vérifiés côté serveur (taille max 5 Mo, types MIME autorisés PDF/JPG/PNG/WebP), puis enregistrés sur le disque persistant sous un nom UUID unique. Leurs métadonnées sont stockées dans la table `private_files`.")
    add_bullet("Étape 3 : Paiement Mobile Money & Quittance", "Intégration du parcours de paiement des frais de dossier via Mobile Money (Airtel Money / Moov Money). Une fois le paiement validé par le système, une quittance officielle imprimable est automatiquement générée, comportant un numéro d'enregistrement unique et un horodatage infalsifiable.")
    add_bullet("Étape 4 : Suivi en direct du statut", "Le candidat suit en continu l'état de son dossier : 'En attente d'instruction', 'Dossier incomplet (pièce manquante)', 'Candidature validée pour le concours' ou 'Refusée'.")

    add_h3("2.4.3 Module 3 : Assistant Virtuel IA multi-modèles (Gemini, OpenAI, Claude) et TTS vocal")
    add_p("L'assistant conversationnel de l'INPTIC représente l'une des innovations majeures du projet. Accessible sur `/chatbot` et via une bulle flottante sur l'ensemble du site, il offre aux usagers une assistance intelligente instantanée.")
    add_p("Les caractéristiques techniques phares de ce module incluent :", bold_prefix="Fonctionnalités avancées de l'IA : ")
    add_bullet("Moteur par défaut Google Gemini Pro/Flash", "L'assistant exploite le modèle `gemini-3.1-pro-preview` côté serveur, couplé à la recherche Google en direct (Google Search Grounding) pour les données récentes et à l'exécution de code Python pour les calculs d'éligibilité des candidats.")
    add_bullet("Panneau d'administration IA multi-fournisseurs", "Depuis l'espace superadmin (`/admin/ai-settings`), l'administrateur peut basculer dynamiquement le moteur d'IA actif entre huit fournisseurs mondiaux : Google Gemini, OpenAI (GPT-4o), Anthropic Claude 3.5, Groq, DeepSeek, Qwen, OpenRouter et Ollama local. Les clés d'API saisies sont chiffrées en base de données par l'algorithme AES-256 avec une clé serveur dédiée (`AI_SETTINGS_ENCRYPTION_KEY`). Aucune clé privée ne transite jamais vers le client.")
    add_bullet("Synthèse vocale naturelle (TTS)", "L'assistant lit les réponses en français grâce au modèle `gemini-3.8-flash-tts` avec la voix féminine 'Achernar', offrant un ton doux, chaleureux et institutionnel. En cas de défaillance du réseau, un fallback transparent bascule sur l'API Web Speech du navigateur client.")

    add_h3("2.4.4 Module 4 : Visite virtuelle 3D interactive du campus (Three.js / React Three Fiber)")
    add_p("Pour offrir une vitrine technologique attrayante et valoriser le patrimoine architectural de l'INPTIC, une visite virtuelle 3D temps réel a été développée sur la page `/visite-3d`. Ce module s'appuie sur la bibliothèque WebGL Three.js et son intégration déclarative React Three Fiber (`@react-three/fiber`) et Drei (`@react-three/drei`).")
    add_p("Le pipeline graphique mis en œuvre est le suivant :")
    add_bullet("Modélisation 3D du campus", "La maquette globale du campus de Gros-Bouquet (`maquette_cour.blend`) a été optimisée dans Blender pour alléger le nombre de polygones et optimiser les textures PBR (Physically Based Rendering).")
    add_bullet("Gestion dynamique des caméras et zones", "L'utilisateur peut basculer entre une vue globale aérienne et plusieurs zones clés (Bâtiment administratif, Amphis, Laboratoires réseaux, Bibliothèque, Terrains de sport). Des transitions douces par interpolation de caméra (lerp) assurent une navigation fluide.")
    add_bullet("Marqueurs interactifs et audio", "Des points d'intérêt cliquables affichent des fiches descriptives détaillant les équipements technologiques de chaque bâtiment.")

    add_h3("2.4.5 Module 5 : Espaces métiers : Scolarité, Direction Générale, RH, Communication")
    add_p("Chaque direction de l'INPTIC dispose de son propre tableau de bord spécialisé :")
    add_bullet("Espace Scolarité (`/scolarite`)", "Permet aux agents d'examiner les dossiers des candidats, de prévisualiser les documents PDF/images dans un lecteur sécurisé, de valider ou rejeter les pièces avec notification par e-mail, et de publier les documents officiels des étudiants inscrits (certificats de scolarité, relevés de notes).")
    add_bullet("Espace Ressources Humaines (`/admin/rh`)", "Gestion complète des fiches du personnel de l'institut (enseignants permanents, vacataires, personnel administratif). Le module intègre la génération automatique de cartes professionnelles numériques au format badge avec QR Code infalsifiable permettant de vérifier l'authenticité de l'agent en un scan. Un journal d'audit (`site_audit_logs`) consigne chaque modification administrative.")
    add_bullet("Espace Communication (`/annonces`)", "Outil de publication des communiqués officiels, concours et actualités. Il intègre un agrégateur RSS de veille technologique (`tech-veille`), un module d'analyse du sentiment public sur les réseaux sociaux (Facebook Graph API et commentaires YouTube) et un gestionnaire de newsletter avec confirmation d'adresse à double opt-in.")
    add_bullet("Espace Direction Générale (`/directeur`)", "Visualisation des indicateurs clés de performance (nombre d'inscrits, taux de validation, affluence sur le portail) et gestion du message éditorial du Directeur Général affiché en page d'accueil.")

    add_h3("2.4.6 Module 6 : Écosystème étudiant (Clubs, Alumni), PWA et Internationalisation (i18n)")
    add_p("La vie de campus et le réseau des anciens étudiants sont pleinement valorisés :")
    add_bullet("Gestion des clubs et associations (`/clubs`)", "Les étudiants peuvent postuler aux différents sous-clubs (Développement, Réseau & Sécurité, Infographie, Audiovisuel, Sport). Les visiteurs peuvent apprécier (liker) les clubs grâce à un système basé sur des cookies sécurisés sans nécessiter de création de compte.")
    add_bullet("Plateforme Alumni (`/alumni`)", "Annuaire professionnel interactif permettant aux diplômés de l'INPTIC de publier leur fiche de carrière avec un outil de recadrage de photo intégré (zoom et positionnement) afin de favoriser le mentorat des nouveaux étudiants.")
    add_bullet("Progressive Web App (PWA)", "Grâce au fichier `manifest.ts` et aux workers de mise en cache, la plateforme est installable directement sur l'écran d'accueil des smartphones et tablettes, garantissant un affichage instantané et une accessibilité hors-connexion pour les pages institutionnelles principales.")
    add_bullet("Internationalisation multilingue (i18n)", "L'ensemble des contenus, formulaires et messages système est disponible en quatre langues majeures : Français, Anglais, Chinois Mandarin et Arabe, assurant un rayonnement académique international.")

    add_h2("2.5 Résultats obtenus et métriques de validation")
    add_p("Au terme du déploiement en environnement de recette puis de production sur l'infrastructure LWS, les résultats techniques et fonctionnels ont pleinement répondu aux exigences du cahier des charges :")
    add_bullet("Performance de chargement", "Score Lighthouse supérieur à 90 sur les pages publiques ; temps de premier affichage utile (FCP) inférieur à 1,2 seconde grâce aux optimisations d'images WebP/AVIF et au rendu serveur Next.js.")
    add_bullet("Sécurité et résilience", "Zéro faille critique identifiée lors des audits de contrôle d'accès ; étanchéité absolue des espaces métiers ; cookies de session protégés contre le vol de jetons.")
    add_bullet("Adhésion des utilisateurs", "Fluidification spectaculaire du traitement des candidatures lors des phases de test : le temps moyen de traitement d'un dossier candidat par un agent de scolarité est passé de 25 minutes (format papier traditionnel) à moins de 3 minutes sur la plateforme numérique.")

    add_h2("2.6 Difficultés techniques rencontrées et solutions innovantes apportées")
    add_p("Tout projet d'ingénierie d'envergure comporte des défis techniques notables. Durant ce stage, plusieurs obstacles majeurs ont été surmontés :")
    
    add_bullet("1. Limitation mémoire sur l'hébergement mutualisé LWS Node.js", "Problème : Les compilations complètes Next.js consommaient plus de 1,5 Go de RAM en pic, provoquant l'interruption du processus par le système d'exploitation (OOM killer). Solution : Nous avons implémenté une commande de build sur-mesure (`npm run build:next`), limitant Next.js à un seul thread worker (`cpus: 1`), activant les optimisations mémoire Webpack (`webpackMemoryOptimizations: true`) et déportant la vérification de types (`tsc --noEmit`) en amont.")
    add_bullet("2. Sécurisation du stockage des pièces jointes privées", "Problème : Éviter que les dossiers des candidats (contenant des données personnelles sensibles) ne soient accessibles par de simples URL publiques devinables. Solution : Implémentation d'un répertoire de stockage totalement hors de la racine publique (`PRIVATE_STORAGE_DIR`), servi exclusivement par une route d'API protégée (`/api/storage/...`) qui valide la session, vérifie l'identité du candidat ou le rôle 'scolarite' avant de streamer le fichier.")
    add_bullet("3. Fluidité de la scène 3D sur smartphones d'entrée de gamme", "Problème : Ralentissements d'affichage (chute de FPS) constatés sur les téléphones mobiles lors du chargement de la maquette 3D. Solution : Optimisation poussée du maillage 3D dans Blender, élimination des polygones invisibles, réduction de la résolution des textures et désactivation des ombres dynamiques complexes sur les petits écrans.")

    doc.add_page_break()

    # =========================================================================
    # DÉVELOPPEMENT — BLOC 3 : BILAN DE LA MISSION
    # =========================================================================
    add_h1("DÉVELOPPEMENT — BLOC 3 : BILAN DE LA MISSION ET RETOUR D'EXPÉRIENCE")
    
    add_h2("3.1 Compétences techniques et méthodologiques acquises")
    add_p("Ce stage d'immersion professionnelle au sein de l'INPTIC a constitué une étape décisive et transformatrice dans ma trajectoire d'ingénieur logiciel. Il m'a permis de confronter les théories académiques aux contraintes impitoyables de la production réelle.")
    add_p("Sur le plan purement technique, les compétences consolidées sont majeures :", bold_prefix="Acquis techniques : ")
    add_bullet("Maîtrise approfondie de Next.js et de React 19", "Compréhension fine de l'App Router, de la séparation entre React Server Components (RSC) et composants clients réactifs, et de la gestion avancée des caches et du streaming.")
    add_bullet("Ingénierie de données relationnelles PostgreSQL", "Conception de schémas normalisés, écriture de scripts de migration incrémentaux, gestion des contraintes d'intégrité référentielle, indexation avancée et requêtes SQL complexes.")
    add_bullet("Génie logiciel et sécurité applicative", "Conception d'une architecture RBAC robuste, sécurisation des flux de données, hachage cryptographique scrypt, chiffrement symétrique AES-256 et gestion des vulnérabilités Web (XSS, CSRF, injections SQL).")
    add_bullet("Intelligence Artificielle générative appliquée", "Intégration d'API de LLM (Gemini Pro/Flash), prompt engineering avancé, implémentation de recherche groundée, synthèse vocale (TTS) et gestion dynamique des fournisseurs de modèles.")
    add_bullet("Graphisme 3D temps réel pour le Web", "Manipulation de maquettes 3D sous Blender, intégration WebGL via Three.js et React Three Fiber, et optimisation des ressources GPU.")

    add_h2("3.2 Développement personnel, savoir-être et compétences transversales")
    add_p("Au-delà de la dimension informatique, cette expérience m'a permis de forger des compétences humaines et managériales indispensables à la vie professionnelle :")
    add_bullet("Sens de l'écoute et communication avec des interlocuteurs non-techniciens", "J'ai appris à traduire des besoins administratifs formulés en langage métier par la Scolarité ou les RH en spécifications algorithmiques précises.")
    add_bullet("Rigueur méthodologique et sens des responsabilités", "Être le responsable du développement de la vitrine numérique officielle d'une grande institution publique exige une vigilance de chaque instant, un respect scrupuleux des normes de codage et une documentation exhaustive.")
    add_bullet("Capacité d'adaptation et résilience face aux imprévus", "La résolution des contraintes techniques sur serveur LWS et les ajustements d'architectures d'IA ont renforcé mon autonomie et ma persévérance face à des problématiques inédites.")

    add_h2("3.3 Valeur ajoutée et retombées directes pour l'INPTIC Gabon")
    add_p("L'impact du projet pour la structure d'accueil est concret, mesurable et pérenne :")
    add_bullet("Modernisation radicale de l'image institutionnelle", "L'INPTIC dispose désormais d'un portail moderne, bilingue, doté d'une visite 3D et d'un assistant IA, renforçant considérablement son attractivité auprès des bacheliers, des étudiants internationaux et des partenaires industriels.")
    add_bullet("Efficacité administrative décuplée", "La dématérialisation des concours d'entrée élimine les files d'attente physiques, prévient les pertes de dossiers papier et accélère le travail d'instruction de la Scolarité.")
    add_bullet("Outil souverain et économique", "La conception d'une architecture propriétaire évite à l'institut de recourir à des abonnements logiciels SaaS récurrents coûteux, tout en garantissant la souveraineté totale des données académiques et du personnel sur le sol national.")

    doc.add_page_break()

    # =========================================================================
    # CONCLUSION GÉNÉRALE
    # =========================================================================
    add_h1("CONCLUSION GÉNÉRALE")
    
    add_h2("1. Synthèse des résultats et objectifs atteints")
    add_p("Au terme de ce stage de fin de cycle, le bilan général est extrêmement positif. L'ensemble des objectifs fixés dans le cahier des charges initial a été atteint avec un niveau d'exigence technique et esthétique particulièrement élevé.")
    add_p("La nouvelle plateforme de l'INPTIC regroupe avec cohérence :")
    add_bullet("Un portail public multilingue (Français, Anglais, Chinois, Arabe) et PWA installable.")
    add_bullet("Une chaîne d'e-admission totalement dématérialisée avec génération de quittances numériques.")
    add_bullet("Des espaces de travail dédiés et sécurisés pour la Scolarité, la Direction des Études, la Communication et les RH (avec cartes professionnelles QR Code).")
    add_bullet("Des fonctionnalités d'avant-garde : un assistant IA conversationnel multi-modèles avec synthèse vocale et une visite 3D immersive du campus.")
    add_bullet("Une base relationnelle PostgreSQL robuste et une documentation technique complète permettant une exploitation sereine par les équipes de l'institut.")

    add_h2("2. Apports personnels et académiques")
    add_p("Ce projet a marqué une étape fondamentale dans ma maturation d'ingénieur logiciel. Il a matérialisé la synthèse vivante de l'ensemble des connaissances acquises durant mon cursus à l'INPTIC, en les confrontant aux impératifs d'un produit logiciel destiné à des milliers d'usagers réels.")
    add_p("Cette immersion m'a apporté la conviction que l'ingénierie logicielle ne se limite pas à l'écriture de lignes de code, mais réside avant tout dans la capacité à comprendre des enjeux organisationnels, à écouter des utilisateurs et à bâtir des solutions technologiques élégantes, pérennes et sécurisées.")

    add_h2("3. Perspectives d'évolution futures")
    add_p("Bien que la plateforme soit pleinement opérationnelle en production, un produit numérique est un organisme vivant appelé à évoluer continuellement. Plusieurs axes de perfectionnement futurs ont été identifiés :")
    add_bullet("1. Passerelle bancaire directe Visa/Mastercard et GIMAC", "Compléter les paiements Mobile Money par une intégration directe avec le commutateur monétique sous-régional GIMAC pour faciliter les règlements des candidats étrangers.")
    add_bullet("2. Application mobile native via Capacitor", "Encapsuler la PWA existante dans un conteneur natif pour publier l'application officielle de l'INPTIC sur Google Play Store et Apple App Store.")
    add_bullet("3. IA prédictive pour l'aide à l'orientation", "Entraîner un modèle d'apprentissage automatique spécialisé capable d'analyser les notes du cursus secondaire d'un candidat pour lui recommander avec précision la filière INPTIC la plus en adéquation avec son potentiel.")

    doc.add_page_break()

    # =========================================================================
    # BIBLIOGRAPHIE ET WEBOGRAPHIE
    # =========================================================================
    add_h1("BIBLIOGRAPHIE ET WEBOGRAPHIE")
    
    add_h2("Ouvrages de référence & Publications académiques")
    add_p("1. GAMMA, Erich, HELM, Richard, JOHNSON, Ralph, VLISSIDES, John. Design Patterns: Elements of Reusable Object-Oriented Software. Addison-Wesley, 1994, 416 p.")
    add_p("2. MARTIN, Robert C. Clean Architecture: A Craftsman's Guide to Software Structure and Design. Prentice Hall, 2017, 432 p.")
    add_p("3. FOWLER, Martin. Patterns of Enterprise Application Architecture. Addison-Wesley Professional, 2002, 560 p.")
    add_p("4. PERCIVAL, Harry. Architecture Patterns with Python: Enabling Test-Driven Development, Domain-Driven Design, and Event-Driven Microservices. O'Reilly Media, 2020, 314 p.")
    add_p("5. PARISI, Tony. Programming 3D Applications with HTML5 and WebGL: 3D Animation and Visualization for Web Pages. O'Reilly Media, 2014, 400 p.")

    add_h2("Documentations officielles et Références techniques")
    add_p("6. Vercel Inc. Documentation officielle Next.js 16 (App Router, Server Components, Route Handlers). Disponible sur : https://nextjs.org/docs [consulté en octobre 2026].")
    add_p("7. React Core Team. Documentation officielle React 19. Disponible sur : https://react.dev [consulté en octobre 2026].")
    add_p("8. PostgreSQL Global Development Group. Documentation PostgreSQL 15 & 16 (Types de données, Indexation, Optimisation des requêtes). Disponible sur : https://www.postgresql.org/docs/ [consulté en octobre 2026].")
    add_p("9. Google Cloud & Google DeepMind. Gemini AI Documentation (Generative AI SDK, Multimodal Models, Grounding & Tool Calling). Disponible sur : https://ai.google.dev/docs [consulté en octobre 2026].")
    add_p("10. Three.js Authors. Three.js JavaScript 3D Library Documentation and Examples. Disponible sur : https://threejs.org/docs/ [consulté en octobre 2026].")
    add_p("11. Poimandres Team. React Three Fiber (R3F) & Drei Documentation. Disponible sur : https://r3f.docs.pmnd.rs/ [consulté en octobre 2026].")
    add_p("12. Tailwind Labs. Documentation officielle Tailwind CSS v4.0. Disponible sur : https://tailwindcss.com/docs [consulté en octobre 2026].")
    add_p("13. Strapi Solutions. Strapi 5 Documentation (Headless CMS, REST API, Content-Types Builder). Disponible sur : https://docs.strapi.io [consulté en octobre 2026].")
    add_p("14. OWASP Foundation. OWASP Top 10: 2021 The Ten Most Critical Web Application Security Risks. Disponible sur : https://owasp.org/Top10/ [consulté en octobre 2026].")
    add_p("15. IETF (Internet Engineering Task Force). RFC 7914: The scrypt Password-Based Key Derivation Function. Disponible sur : https://datatracker.ietf.org/doc/html/rfc7914 [consulté en octobre 2026].")

    doc.add_page_break()

    # =========================================================================
    # ANNEXES TECHNIQUES
    # =========================================================================
    add_h1("ANNEXES TECHNIQUES")
    
    add_h2("Annexe A : Dictionnaire et Schéma relationnel de la base PostgreSQL")
    add_p("La base de données applicative repose sur un ensemble de 15 tables relationnelles principales, créées et ordonnées à travers les migrations SQL du projet (`scripts/00_lws_complete_schema.sql` à `scripts/23_club_news_feed.sql`).")

    db_tables = [
        ["app_users", "Identifiants, adresses email vérifiées, hash scrypt des mots de passe et rôle principal."],
        ["user_sessions", "Jetons de sessions sécurisées (hachés en SHA-256), date d'expiration et identifiant utilisateur."],
        ["candidate_profiles", "Dossiers de candidature : état civil, filière souhaitée, téléphone, statut de validation."],
        ["private_files", "Métadonnées des justificatifs candidats : nom d'origine, chemin UUID sur disque, type MIME, taille."],
        ["actualites", "Annonces officielles, communiqués de presse, actualités et pages de destination associées."],
        ["concours", "Fiches descriptives des sessions de concours, dates d'ouverture et clôture, documents à fournir."],
        ["rh_personnel", "Annuaire des employés INPTIC : nom, prénom, direction, service, matricule, statut."],
        ["rh_cards", "Cartes professionnelles générées : identifiant unique, clé de hachage du QR code, date d'émission."],
        ["site_audit_logs", "Journal d'audit de sécurité traçant les actions sensibles (création/suppression admin, export RH)."],
        ["ai_provider_settings", "Configuration des fournisseurs LLM : nom du provider, modèle actif, clé API chiffrée AES."],
        ["clubs & sub_clubs", "Clubs étudiants (sport, informatique, audiovisuel), fiches de présentation et compteurs de likes."],
        ["club_candidates", "Candidatures des étudiants aux sous-clubs spécialisés avec motivation et statut."],
        ["newsletter_subscribers", "Abonnés à la newsletter institutionnelle avec horodatage et jeton de désinscription."],
        ["alumni_profiles", "Annuaire des anciens diplômés : promotion, poste actuel, entreprise, photo recadrée."],
        ["homepage_agenda", "Événements officiels, dates des concours et journées portes ouvertes affichés en accueil."],
    ]
    add_table_styled(["Nom de la Table", "Description et Données Enregistrées"], db_tables, [2.0, 4.5])

    add_h2("Annexe B : Extraits de code source structurants")
    add_p("Extrait du service de chiffrement symétrique AES-256 utilisé pour protéger les clés d'API des modèles d'intelligence artificielle dans la base de données :", bold_prefix="Sécurité des clés IA : ")

    add_code_snippet(
"""import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export function encryptSecret(plainText: string, encryptionKeyHex: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(encryptionKeyHex, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encryptedPayload: string, encryptionKeyHex: string): string {
  const [ivHex, tagHex, encryptedData] = encryptedPayload.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const key = Buffer.from(encryptionKeyHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}""", caption="Chiffrement/Déchiffrement AES-256-GCM des clés d'API IA (lib/ai-provider-settings.ts)")

    add_h2("Annexe C : Procédure opérationnelle de déploiement en production (LWS)")
    add_p("Le déploiement sur l'hébergement Node.js LWS respecte une procédure rigoureuse d'exploitation :")
    add_bullet("1. Préparation de la base de données", "Création de la base PostgreSQL dans le panneau LWS, puis exécution du script maître `scripts/00_lws_complete_schema.sql` via `psql`.")
    add_bullet("2. Configuration des variables d'environnement serveur", "Déclaration des secrets dans l'environnement Node.js (sans préfixe NEXT_PUBLIC_) : `DATABASE_URL`, `PRIVATE_STORAGE_DIR`, `AUTH_SITE_URL`, `AI_SETTINGS_ENCRYPTION_KEY`, `GEMINI_API_KEY`, et les paramètres SMTP LWS.")
    add_bullet("3. Compilation optimisée sans dépassement mémoire", "Exécution de la commande `npm run build:next` qui génère les types de routes, exécute `tsc --noEmit` et compile l'application Next.js avec Webpack en mode un seul worker.")
    add_bullet("4. Initialisation du premier compte administrateur", "Lancement en terminal sécurisé de la commande `npm run create-admin` pour créer le premier compte superadministrateur avec mot de passe haché par scrypt.")

    output_path = "/home/yesse/Bureau/inptic-site-PWA/Rapport_de_Stage_INPTIC_Yesse_Boukinda.docx"
    doc.save(output_path)
    print(f"Rapport de stage généré avec succès dans : {output_path}")

if __name__ == "__main__":
    build_full_report()
