package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

type Claims struct {
	Sub    int64  `json:"sub"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	Title  string `json:"title"`
	Role   string `json:"role"`
	Portal string `json:"portal"`
	Iat    int64  `json:"iat"`
	Exp    int64  `json:"exp"`
}

var b64 = base64.RawURLEncoding

const jwtHeader = `{"alg":"HS256","typ":"JWT"}`

func signToken(c Claims, secret []byte) string {
	payload, _ := json.Marshal(c)
	signingInput := b64.EncodeToString([]byte(jwtHeader)) + "." + b64.EncodeToString(payload)
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(signingInput))
	return signingInput + "." + b64.EncodeToString(mac.Sum(nil))
}

func verifyToken(token string, secret []byte) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed token")
	}
	header, err := b64.DecodeString(parts[0])
	if err != nil || string(header) != jwtHeader {
		return nil, errors.New("unsupported header")
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(parts[0] + "." + parts[1]))
	sig, err := b64.DecodeString(parts[2])
	if err != nil || !hmac.Equal(sig, mac.Sum(nil)) {
		return nil, errors.New("bad signature")
	}
	payload, err := b64.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("bad payload")
	}
	var c Claims
	if err := json.Unmarshal(payload, &c); err != nil {
		return nil, errors.New("bad payload")
	}
	if time.Now().Unix() >= c.Exp {
		return nil, errors.New("token expired")
	}
	return &c, nil
}
