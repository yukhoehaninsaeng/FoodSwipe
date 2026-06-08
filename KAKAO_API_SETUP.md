# 카카오 API 설정 가이드

FoodSwipe에서 사용하는 카카오 API 등록 및 설정 방법입니다.

---

## 목차

1. [카카오 개발자 계정 및 앱 생성](#1-카카오-개발자-계정-및-앱-생성)
2. [REST API 키 발급](#2-rest-api-키-발급)
3. [웹 플랫폼 등록 (웹 서비스용)](#3-웹-플랫폼-등록-웹-서비스용)
4. [카카오 로그인 설정](#4-카카오-로그인-설정)
5. [환경변수 설정](#5-환경변수-설정)
6. [Vercel 배포 시 설정](#6-vercel-배포-시-설정)
7. [앱 출시 시 추가 설정 (iOS / Android)](#7-앱-출시-시-추가-설정-ios--android)
8. [비즈앱 전환 (선택, 권장)](#8-비즈앱-전환-선택-권장)
9. [API 사용 현황 및 요금](#9-api-사용-현황-및-요금)
10. [문제 해결](#10-문제-해결)

---

## 1. 카카오 개발자 계정 및 앱 생성

### 1-1. 개발자 계정 등록

1. [https://developers.kakao.com](https://developers.kakao.com) 접속
2. 우측 상단 **로그인** 클릭 → 카카오 계정으로 로그인
3. 개발자 등록이 처음이라면 **개발자 등록** 화면이 나타남
   - 이름, 이메일 확인 후 **동의하고 가입** 클릭

### 1-2. 애플리케이션 생성

1. 상단 **내 애플리케이션** 클릭
2. **애플리케이션 추가하기** 클릭
3. 아래 정보 입력:

   | 항목 | 입력값 예시 |
   |------|------------|
   | 앱 이름 | `FoodSwipe` |
   | 사업자명 | 개인 이름 또는 회사명 |
   | 카테고리 | 음식 |

4. **저장** 클릭

---

## 2. REST API 키 발급

앱 생성 후 **앱 설정 > 앱 키** 화면에서 확인합니다.

```
네이티브 앱 키:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← 모바일 앱용
REST API 키:    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← ✅ 이게 필요
JavaScript 키: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← 웹 SDK용
Admin 키:       xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← 절대 외부 노출 금지
```

> **REST API 키** 를 복사해 둡니다.

---

## 3. 웹 플랫폼 등록 (웹 서비스용)

카카오 API를 웹에서 호출하려면 도메인을 등록해야 합니다.

1. **앱 설정 > 플랫폼** 탭 클릭
2. **Web 플랫폼 등록** 클릭
3. **사이트 도메인** 에 아래 주소 추가:

   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```

   > `your-app` 부분은 실제 Vercel 프로젝트 도메인으로 변경

4. **저장** 클릭

---

## 4. 카카오 로그인 설정

FoodSwipe에서 카카오 소셜 로그인을 사용하려면 추가 설정이 필요합니다.

### 4-1. 카카오 로그인 활성화

1. **제품 설정 > 카카오 로그인** 클릭
2. **활성화 설정** 을 **ON** 으로 변경

### 4-2. Redirect URI 등록

같은 화면에서 **Redirect URI 등록** 클릭 후 아래 주소 추가:

```
http://localhost:3000/api/auth/callback/kakao
https://your-app.vercel.app/api/auth/callback/kakao
```

### 4-3. 동의항목 설정

**제품 설정 > 카카오 로그인 > 동의항목** 에서 아래 항목 설정:

| 항목 | 설정 |
|------|------|
| 닉네임 | 필수 동의 |
| 프로필 사진 | 선택 동의 |
| 카카오계정(이메일) | 선택 동의 |

### 4-4. Client Secret 발급 (보안 강화, 권장)

1. **보안** 탭 클릭
2. **Client Secret 코드 생성** 클릭
3. **활성화 상태** 를 **사용** 으로 변경
4. 생성된 코드 복사

---

## 5. 환경변수 설정

### 로컬 개발 환경 (.env.local)

프로젝트 루트의 `.env.local` 파일을 아래와 같이 수정합니다:

```env
# 카카오 REST API 키 (음식점 검색, 역지오코딩)
KAKAO_REST_API_KEY=여기에_REST_API_키_붙여넣기

# 카카오 로그인 (소셜 로그인 사용 시)
KAKAO_CLIENT_ID=여기에_REST_API_키_붙여넣기
KAKAO_CLIENT_SECRET=여기에_Client_Secret_붙여넣기

# NextAuth 시크릿 (임의의 랜덤 문자열)
NEXTAUTH_SECRET=여기에_랜덤_문자열_32자이상
NEXTAUTH_URL=http://localhost:3000

# 기본 검색 위치 (서울 마포구 합정동)
NEXT_PUBLIC_DEFAULT_LAT=37.5434
NEXT_PUBLIC_DEFAULT_LNG=126.9076
```

> `.env.local` 은 Git에 커밋되지 않습니다. 절대 공개 저장소에 올리지 마세요.

### NEXTAUTH_SECRET 생성 방법

터미널에서 아래 명령어 실행:

```bash
openssl rand -base64 32
```

또는 [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) 에서 생성

---

## 6. Vercel 배포 시 설정

### 6-1. 환경변수 등록

1. [https://vercel.com](https://vercel.com) 로그인
2. FoodSwipe 프로젝트 선택
3. **Settings > Environment Variables** 클릭
4. 아래 변수를 하나씩 추가:

   | 이름 | 값 | 환경 |
   |------|-----|------|
   | `KAKAO_REST_API_KEY` | REST API 키 | Production, Preview, Development |
   | `KAKAO_CLIENT_ID` | REST API 키 (동일) | Production, Preview, Development |
   | `KAKAO_CLIENT_SECRET` | Client Secret | Production, Preview, Development |
   | `NEXTAUTH_SECRET` | 랜덤 문자열 | Production, Preview, Development |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |

5. **Save** 클릭 후 **Redeploy** (환경변수는 재배포해야 적용됨)

### 6-2. Vercel 도메인 카카오에 추가

Vercel에서 최종 도메인 확인 후 카카오 개발자 콘솔에서:
- 플랫폼 > Web > 사이트 도메인에 `https://your-app.vercel.app` 추가
- 카카오 로그인 > Redirect URI에 `https://your-app.vercel.app/api/auth/callback/kakao` 추가

---

## 7. 앱 출시 시 추가 설정 (iOS / Android)

웹앱을 Capacitor로 네이티브 앱으로 래핑하여 앱스토어에 출시하는 경우 아래 과정이 필요합니다.

### 7-1. Capacitor 초기 설정

```bash
npm install @capacitor/core @capacitor/cli
npx cap init FoodSwipe com.yourname.foodswipe --web-dir=out
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

> `com.yourname.foodswipe` 는 번들 ID (고유 식별자). 앱스토어 등록 시 변경 불가.

### 7-2. iOS 플랫폼 등록

**카카오 개발자 콘솔 > 앱 설정 > 플랫폼 > iOS 플랫폼 등록**

| 항목 | 입력값 예시 |
|------|------------|
| 번들 ID | `com.yourname.foodswipe` |
| 앱스토어 ID | 앱스토어 등록 후 발급되는 숫자 ID |
| 마켓 URL | `https://apps.apple.com/app/id숫자` |

### 7-3. Android 플랫폼 등록

**카카오 개발자 콘솔 > 앱 설정 > 플랫폼 > Android 플랫폼 등록**

| 항목 | 입력값 예시 |
|------|------------|
| 패키지명 | `com.yourname.foodswipe` |
| 마켓 URL | `https://play.google.com/store/apps/details?id=com.yourname.foodswipe` |
| 키 해시 | 아래 명령어로 추출 |

**키 해시 추출 (Android 서명 키에서):**

```bash
# 디버그 키 (개발용)
keytool -exportcert -alias androiddebugkey \
  -keystore ~/.android/debug.keystore \
  -storepass android -keypass android | \
  openssl sha1 -binary | openssl base64

# 릴리즈 키 (배포용) — 앱스토어 등록 전에 생성한 키 사용
keytool -exportcert -alias your-key-alias \
  -keystore your-release-key.keystore | \
  openssl sha1 -binary | openssl base64
```

### 7-4. 카카오 로그인 네이티브 SDK 연동

Capacitor 환경에서 카카오 로그인을 네이티브로 연동하려면:

```bash
npm install @capacitor-community/kakao-login
npx cap sync
```

**iOS (Info.plist에 추가):**

```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>kakaokompassauth</string>
  <string>storekit</string>
  <string>kakaolink</string>
</array>

<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>kakao{REST_API_키}</string>
    </array>
  </dict>
</array>
```

**Android (AndroidManifest.xml에 추가):**

```xml
<activity
  android:name="com.kakao.sdk.auth.AuthCodeHandlerActivity"
  android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:host="oauth"
          android:scheme="kakao{REST_API_키}" />
  </intent-filter>
</activity>
```

### 7-5. 앱 출시 전 체크리스트

- [ ] iOS/Android 플랫폼 카카오 콘솔에 등록
- [ ] 번들 ID / 패키지명 등록
- [ ] Android 릴리즈 키 해시 등록
- [ ] 카카오 로그인 Redirect URI에 앱 스킴 추가 (`kakao{앱키}://oauth`)
- [ ] 비즈앱 전환 완료 (호출량 제한 해제)
- [ ] 개인정보처리방침 URL 등록 (앱스토어 심사 필수)
- [ ] 서비스 약관 URL 등록

---

## 8. 비즈앱 전환 (선택, 권장)

사용자가 늘어나거나 앱스토어 출시 시 비즈앱으로 전환하면 API 한도가 올라갑니다.

### 전환 방법

1. 카카오 개발자 콘솔 > 앱 선택
2. **앱 설정 > 비즈니스** 탭 클릭
3. **비즈 앱 전환** 클릭
4. 서비스 정보 입력:
   - 서비스명, 카테고리, 서비스 URL
   - 개인정보처리방침 URL (필수)
   - 사업자등록번호 (없어도 개인 서비스로 신청 가능)
5. 검토 완료 후 비즈앱 전환 (보통 1~3 영업일)

### 비즈앱 전환 후 달라지는 점

| 항목 | 일반 앱 | 비즈앱 |
|------|---------|--------|
| 로컬 검색 API | 제한 없음 | 제한 없음 |
| 카카오 로그인 | 300,000 DAU | 무제한 |
| 카카오맵 SDK | 일 300,000건 | 협의 가능 |

---

## 9. API 사용 현황 및 요금

### FoodSwipe에서 사용하는 API

| API | 용도 | 요금 |
|-----|------|------|
| 카카오 로컬 - 키워드 검색 | 주변 음식점/카페 검색 | **무료 (무제한)** |
| 카카오 로컬 - 좌표 → 주소 | 현재 위치 역지오코딩 | **무료 (무제한)** |
| 카카오 로그인 | 소셜 로그인 | **무료** |
| 카카오맵 딥링크 | 길찾기 이동 | **무료 (앱 미설치 시 웹으로 이동)** |

> 카카오 로컬 API는 별도 과금 없이 **완전 무료**로 제공됩니다.

### Google Places API와 비교

| 항목 | 카카오 | Google |
|------|--------|--------|
| 월 무료 한도 | **무제한** | $200 크레딧 (~5,000건) |
| 초과 요금 | **없음** | $17~32 / 1,000건 |
| 한국 데이터 품질 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 10. 문제 해결

### API 호출 시 401 Unauthorized

- REST API 키가 올바르게 설정되었는지 확인
- `.env.local` 파일 수정 후 개발 서버 재시작 (`npm run dev`)
- Vercel 환경에서는 환경변수 저장 후 **Redeploy** 필수

### API 호출 시 403 Forbidden

- 카카오 개발자 콘솔에서 플랫폼(도메인) 등록 여부 확인
- 호출하는 도메인이 등록된 도메인과 일치하는지 확인
- `localhost:3000` 과 `127.0.0.1:3000` 은 다르게 인식됨

### 카카오 로그인이 안 됨

- Redirect URI가 정확히 등록되어 있는지 확인 (슬래시 하나까지 동일해야 함)
- `NEXTAUTH_URL` 환경변수가 현재 서비스 URL과 일치하는지 확인
- Client Secret을 사용한다면 `KAKAO_CLIENT_SECRET` 환경변수 확인

### 음식점이 검색되지 않음 (로컬 데이터만 표시)

- `KAKAO_REST_API_KEY` 가 설정되지 않으면 앱 내장 샘플 데이터로 대체됨
- API 키 설정 후 서버 재시작 필요

---

## 참고 링크

- [카카오 개발자 콘솔](https://developers.kakao.com)
- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [카카오 로그인 API 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [카카오 Capacitor 플러그인](https://github.com/capacitor-community/kakao-login)
