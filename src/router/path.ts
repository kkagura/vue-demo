const enum TokenType {
  Static,
  Param,
  Group,
}

// Scoring values used in tokensToParser
const enum PathScore {
  _multiplier = 10,
  Root = 9 * _multiplier, // just /
  Segment = 4 * _multiplier, // /a-segment
  SubSegment = 3 * _multiplier, // /multiple-:things-in-one-:segment
  Static = 4 * _multiplier, // /static
  Dynamic = 2 * _multiplier, // /:someId
  BonusCustomRegExp = 1 * _multiplier, // /:someId(\\d+)
  BonusWildcard = -4 * _multiplier - BonusCustomRegExp, // /:namedWildcard(.*) we remove the bonus added by the custom regexp
  BonusRepeatable = -2 * _multiplier, // /:w+ or /:w*
  BonusOptional = -0.8 * _multiplier, // /:w? or /:w*
  // these two have to be under 0.1 so a strict /:page is still lower than /:a-:b
  BonusStrict = 0.07 * _multiplier, // when options strict: true is passed, as the regex omits \/?
  BonusCaseSensitive = 0.025 * _multiplier, // when options strict: true is passed, as the regex omits \/?
}
const BASE_PARAM_PATTERN = "[^/]+?";
const BASE_PATH_PARSER_OPTIONS = {
  sensitive: false,
  strict: false,
  start: true,
  end: true,
};

// Special Regex characters that must be escaped in static tokens
const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
const assign = Object.assign;

type PathParams = Record<string, string | string[]>;

/**
 * A param in a url like `/users/:id`
 */
interface PathParserParamKey {
  name: string;
  repeatable: boolean;
  optional: boolean;
}

export interface PathParser {
  /**
   * The regexp used to match a url
   */
  re: RegExp;

  /**
   * The score of the parser
   */
  score: Array<number[]>;

  /**
   * Keys that appeared in the path
   */
  keys: PathParserParamKey[];
  /**
   * Parses a url and returns the matched params or null if it doesn't match. An
   * optional param that isn't preset will be an empty string. A repeatable
   * param will be an array if there is at least one value.
   *
   * @param path - url to parse
   * @returns a Params object, empty if there are no params. `null` if there is
   * no match
   */
  parse(path: string): PathParams | null;

  /**
   * Creates a string version of the url
   *
   * @param params - object of params
   * @returns a url
   */
  stringify(params: PathParams): string;
}

/**
 * Creates a path parser from an array of Segments (a segment is an array of Tokens)
 *
 * @param segments - array of segments returned by tokenizePath
 * @param extraOptions - optional options for the regexp
 * @returns a PathParser
 */
export function tokensToParser(
  segments: Array<any[]>,
  extraOptions?: any
): PathParser {
  const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);

  // the amount of scores is the same as the length of segments except for the root segment "/"
  const score: Array<number[]> = [];
  // the regexp as a string
  let pattern = options.start ? "^" : "";
  // extracted keys
  const keys: any[] = [];

  for (const segment of segments) {
    // the root segment needs special treatment
    const segmentScores: number[] = segment.length ? [] : [PathScore.Root];

    // allow trailing slash
    if (options.strict && !segment.length) pattern += "/";
    for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
      const token = segment[tokenIndex];
      // resets the score if we are inside a sub-segment /:a-other-:b
      let subSegmentScore: number =
        PathScore.Segment +
        (options.sensitive ? PathScore.BonusCaseSensitive : 0);

      if (token.type === TokenType.Static) {
        // prepend the slash if we are starting a new segment
        if (!tokenIndex) pattern += "/";
        pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
        subSegmentScore += PathScore.Static;
      } else if (token.type === TokenType.Param) {
        const { value, repeatable, optional, regexp } = token;
        keys.push({
          name: value,
          repeatable,
          optional,
        });
        const re = regexp ? regexp : BASE_PARAM_PATTERN;
        // the user provided a custom regexp /:id(\\d+)
        if (re !== BASE_PARAM_PATTERN) {
          subSegmentScore += PathScore.BonusCustomRegExp;
          // make sure the regexp is valid before using it
          try {
            new RegExp(`(${re})`);
          } catch (err) {
            throw new Error(
              `Invalid custom RegExp for param "${value}" (${re}): ` +
                (err as Error).message
            );
          }
        }

        // when we repeat we must take care of the repeating leading slash
        let subPattern = repeatable ? `((?:${re})(?:/(?:${re}))*)` : `(${re})`;

        // prepend the slash if we are starting a new segment
        if (!tokenIndex)
          subPattern =
            // avoid an optional / if there are more segments e.g. /:p?-static
            // or /:p?-:p2
            optional && segment.length < 2
              ? `(?:/${subPattern})`
              : "/" + subPattern;
        if (optional) subPattern += "?";

        pattern += subPattern;

        subSegmentScore += PathScore.Dynamic;
        if (optional) subSegmentScore += PathScore.BonusOptional;
        if (repeatable) subSegmentScore += PathScore.BonusRepeatable;
        if (re === ".*") subSegmentScore += PathScore.BonusWildcard;
      }

      segmentScores.push(subSegmentScore);
    }

    // an empty array like /home/ -> [[{home}], []]
    // if (!segment.length) pattern += '/'

    score.push(segmentScores);
  }

  // only apply the strict bonus to the last score
  if (options.strict && options.end) {
    const i = score.length - 1;
    score[i][score[i].length - 1] += PathScore.BonusStrict;
  }

  // TODO: dev only warn double trailing slash
  if (!options.strict) pattern += "/?";

  if (options.end) pattern += "$";
  // allow paths like /dynamic to only match dynamic or dynamic/... but not dynamic_something_else
  else if (options.strict) pattern += "(?:/|$)";

  const re = new RegExp(pattern, options.sensitive ? "" : "i");

  function parse(path: string): PathParams | null {
    const match = path.match(re);
    const params: PathParams = {};

    if (!match) return null;

    for (let i = 1; i < match.length; i++) {
      const value: string = match[i] || "";
      const key = keys[i - 1];
      params[key.name] = value && key.repeatable ? value.split("/") : value;
    }

    return params;
  }

  function stringify(params: PathParams): string {
    let path = "";
    // for optional parameters to allow to be empty
    let avoidDuplicatedSlash: boolean = false;
    for (const segment of segments) {
      if (!avoidDuplicatedSlash || !path.endsWith("/")) path += "/";
      avoidDuplicatedSlash = false;

      for (const token of segment) {
        if (token.type === TokenType.Static) {
          path += token.value;
        } else if (token.type === TokenType.Param) {
          const { value, repeatable, optional } = token;
          const param: string | readonly string[] =
            value in params ? params[value] : "";

          if (Array.isArray(param) && !repeatable) {
            throw new Error(
              `Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`
            );
          }

          const text: string = Array.isArray(param)
            ? (param as string[]).join("/")
            : (param as string);
          if (!text) {
            if (optional) {
              // if we have more than one optional param like /:a?-static we don't need to care about the optional param
              if (segment.length < 2) {
                // remove the last slash as we could be at the end
                if (path.endsWith("/")) path = path.slice(0, -1);
                // do not append a slash on the next iteration
                else avoidDuplicatedSlash = true;
              }
            } else throw new Error(`Missing required param "${value}"`);
          }
          path += text;
        }
      }
    }

    // avoid empty path when we have multiple optional params
    return path || "/";
  }

  return {
    re,
    score,
    keys,
    parse,
    stringify,
  };
}

enum TokenizerState {
  Static,
  Param,
  ParamRegExp, // custom re for a param
  ParamRegExpEnd, // check if there is any ? + *
  EscapeNext,
}

const ROOT_TOKEN = {
  type: TokenType.Static,
  value: "",
};

const VALID_PARAM_RE = /[a-zA-Z0-9_]/;

type Token = any;
export function tokenizePath(path: string): Array<Token[]> {
  if (!path) return [[]];
  if (path === "/") return [[ROOT_TOKEN]];
  if (!path.startsWith("/")) {
    throw new Error("path需要以/开头");
  }

  // if (tokenCache.has(path)) return tokenCache.get(path)!

  function crash(message: string) {
    throw new Error(`ERR (${state})/"${buffer}": ${message}`);
  }

  let state: TokenizerState = TokenizerState.Static;
  let previousState: TokenizerState = state;
  const tokens: Array<Token[]> = [];
  // the segment will always be valid because we get into the initial state
  // with the leading /
  let segment!: Token[];

  function finalizeSegment() {
    if (segment) tokens.push(segment);
    segment = [];
  }

  // index on the path
  let i = 0;
  // char at index
  let char: string;
  // buffer of the value read
  let buffer: string = "";
  // custom regexp for a param
  let customRe: string = "";

  function consumeBuffer() {
    if (!buffer) return;

    if (state === TokenizerState.Static) {
      segment.push({
        type: TokenType.Static,
        value: buffer,
      });
    } else if (
      state === TokenizerState.Param ||
      state === TokenizerState.ParamRegExp ||
      state === TokenizerState.ParamRegExpEnd
    ) {
      if (segment.length > 1 && (char === "*" || char === "+"))
        crash(
          `A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`
        );
      segment.push({
        type: TokenType.Param,
        value: buffer,
        regexp: customRe,
        repeatable: char === "*" || char === "+",
        optional: char === "*" || char === "?",
      });
    } else {
      crash("Invalid state to consume buffer");
    }
    buffer = "";
  }

  function addCharToBuffer() {
    buffer += char;
  }

  while (i < path.length) {
    char = path[i++];

    if (char === "\\" && state !== TokenizerState.ParamRegExp) {
      previousState = state;
      state = TokenizerState.EscapeNext;
      continue;
    }

    switch (state) {
      case TokenizerState.Static:
        if (char === "/") {
          if (buffer) {
            consumeBuffer();
          }
          finalizeSegment();
        } else if (char === ":") {
          consumeBuffer();
          state = TokenizerState.Param;
        } else {
          addCharToBuffer();
        }
        break;

      case TokenizerState.EscapeNext:
        addCharToBuffer();
        state = previousState;
        break;

      case TokenizerState.Param:
        if (char === "(") {
          state = TokenizerState.ParamRegExp;
        } else if (VALID_PARAM_RE.test(char)) {
          addCharToBuffer();
        } else {
          consumeBuffer();
          state = TokenizerState.Static;
          // go back one character if we were not modifying
          if (char !== "*" && char !== "?" && char !== "+") i--;
        }
        break;

      case TokenizerState.ParamRegExp:
        // TODO: is it worth handling nested regexp? like :p(?:prefix_([^/]+)_suffix)
        // it already works by escaping the closing )
        // https://paths.esm.dev/?p=AAMeJbiAwQEcDKbAoAAkP60PG2R6QAvgNaA6AFACM2ABuQBB#
        // is this really something people need since you can also write
        // /prefix_:p()_suffix
        if (char === ")") {
          // handle the escaped )
          if (customRe[customRe.length - 1] == "\\")
            customRe = customRe.slice(0, -1) + char;
          else state = TokenizerState.ParamRegExpEnd;
        } else {
          customRe += char;
        }
        break;

      case TokenizerState.ParamRegExpEnd:
        // same as finalizing a param
        consumeBuffer();
        state = TokenizerState.Static;
        // go back one character if we were not modifying
        if (char !== "*" && char !== "?" && char !== "+") i--;
        customRe = "";
        break;

      default:
        crash("Unknown state");
        break;
    }
  }

  if (state === TokenizerState.ParamRegExp)
    crash(`Unfinished custom RegExp for param "${buffer}"`);

  consumeBuffer();
  finalizeSegment();

  // tokenCache.set(path, tokens)

  return tokens;
}
