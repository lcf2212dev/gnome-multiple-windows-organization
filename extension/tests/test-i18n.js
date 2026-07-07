// Testes unitários do seletor de idioma e tradução manual.
// Rodar com:  gjs -m extension/tests/test-i18n.js
import System from 'system';
import * as I18n from '../lib/i18n.js';

let failures = 0;
let total = 0;

function check(label, actual, expected) {
    total++;
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) {
        failures++;
        print(`✗ ${label}\n    esperado: ${e}\n    obtido:   ${a}`);
    }
}

function checkTrue(label, condition) {
    total++;
    if (!condition) {
        failures++;
        print(`✗ ${label}`);
    }
}

const settings = value => ({
    get_string(key) {
        if (key !== 'ui-language')
            throw new Error(`unexpected key: ${key}`);
        return value;
    },
});

check('idiomas disponíveis', I18n.LANGUAGE_OPTIONS.map(option => option.code),
    ['system', 'en', 'pt', 'es', 'fr', 'de', 'zh_CN']);
check('pt_BR normaliza para pt', I18n.normalizeLanguageCode('pt_BR.UTF-8'), 'pt');
check('zh normaliza para zh_CN', I18n.normalizeLanguageCode('zh-Hans.UTF-8'), 'zh_CN');
check('código inválido volta para en', I18n.normalizeLanguageCode('eo'), 'en');
check('índice de de', I18n.languageIndex(settings('de')), 5);
check('código por índice', I18n.languageCodeAt(6), 'zh_CN');
check('índice inválido volta para system', I18n.languageCodeAt(999), 'system');
check('tradução manual pt', I18n.translate('Language', settings('pt')), 'Idioma');
check('tradução manual es', I18n.translate('Language', settings('es')), 'Idioma');
check('tradução manual fr', I18n.translate('Language', settings('fr')), 'Langue');
check('tradução manual de', I18n.translate('Language', settings('de')), 'Sprache');
check('tradução manual zh_CN', I18n.translate('Language', settings('zh_CN')), '语言');
check('manual en mantém msgid', I18n.translate('Language', settings('en')), 'Language');
check('labels incluem nomes nativos', I18n.languageLabels(message => message),
    ['Automatic (system language)', 'English', 'Português', 'Español', 'Français', 'Deutsch', '中文']);
checkTrue('fallback retorna msgid desconhecido',
    I18n.translate('Untranslated custom text', settings('pt')) === 'Untranslated custom text');

if (failures > 0) {
    print(`\n${failures}/${total} testes de i18n falharam`);
    System.exit(1);
}

print(`✓ ${total} testes de i18n.js passaram`);
